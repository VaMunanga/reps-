import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const url = process.argv[2] ?? "http://127.0.0.1:8765/index.php";
const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browserPath = candidates.find(existsSync);

if (!browserPath) throw new Error("Set CHROME_PATH to a Chromium-based browser executable.");

const profile = await mkdtemp(path.join(os.tmpdir(), "reps-layout-"));
const browser = spawn(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--force-device-scale-factor=1",
  "--no-first-run",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--window-size=390,844",
  url,
], { stdio: "ignore" });

async function devtoolsPort() {
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      return (await readFile(portFile, "utf8")).split(/\r?\n/)[0];
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Browser debugging endpoint did not become ready.");
}

async function evaluate(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const timeout = setTimeout(() => reject(new Error("Layout check timed out.")), 10_000);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        id: 1,
        method: "Emulation.setDeviceMetricsOverride",
        params: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true },
      }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id === 1) {
        socket.send(JSON.stringify({
        id: 2,
        method: "Runtime.evaluate",
        params: {
          awaitPromise: true,
          returnByValue: true,
          expression: `new Promise((resolve) => {
            const measure = () => {
              const hero = document.querySelector('.hero-copy');
              const title = hero.querySelector('h1');
              const rect = hero.getBoundingClientRect();
              resolve({
                viewport: document.documentElement.clientWidth,
                heroLeft: rect.left,
                heroRight: rect.right,
                titleClientWidth: title.clientWidth,
                titleScrollWidth: title.scrollWidth
              });
            };
            const ready = () => requestAnimationFrame(() => requestAnimationFrame(measure));
            document.readyState === 'complete' ? ready() : addEventListener('load', ready, { once: true });
          })`,
        },
        }));
        return;
      }
      if (message.id !== 2) return;
      clearTimeout(timeout);
      socket.close();
      if (message.error || message.result?.exceptionDetails) {
        reject(new Error(message.error?.message ?? message.result.exceptionDetails.text));
        return;
      }
      resolve(message.result.result.value);
    });
    socket.addEventListener("error", () => reject(new Error("Could not inspect browser layout.")));
  });
}

try {
  const port = await devtoolsPort();
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const page = pages.find((candidate) => candidate.type === "page" && candidate.url.startsWith(url));
  if (!page) throw new Error("No browser page was available for layout inspection.");

  const result = await evaluate(page.webSocketDebuggerUrl);
  const cardFits = result.heroLeft >= 0 && result.heroRight <= result.viewport + 1;
  const titleFits = result.titleScrollWidth <= result.titleClientWidth + 1;
  console.log(JSON.stringify({ ...result, cardFits, titleFits }));
  if (!cardFits || !titleFits) process.exitCode = 1;
} finally {
  browser.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }).catch(() => {});
}
