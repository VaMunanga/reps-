import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { initFocusPage } from "../../js/focus/page.js";
import { projectRoot } from "../helpers/load-page.js";

describe("Focus page", () => {
  async function setup(options = {}, storage) {
    const source = await readFile(`${projectRoot}/focus.html`, "utf8");
    const dom = new JSDOM(source, { url: "https://reps.test/focus.html" });
    initFocusPage(dom.window.document, storage ?? dom.window.localStorage, options);
    return { dom, document: dom.window.document };
  }

  it("hydrates defaults and exposes the valid initial control state", async () => {
    const source = await readFile(`${projectRoot}/focus.html`, "utf8");
    const dom = new JSDOM(source, { url: "https://reps.test/focus.html" });

    initFocusPage(dom.window.document, dom.window.localStorage);

    expect(dom.window.document.querySelector("#timer").textContent).toBe("25:00");
    expect(dom.window.document.querySelector('[data-timer-action="start"]').disabled).toBe(false);
    expect(dom.window.document.querySelector('[data-timer-action="pause"]').disabled).toBe(true);
    expect(dom.window.document.querySelector("#focus-status").textContent).toBe("Ready when you are.");
  });

  it("rejects invalid numeric settings without throwing or starting", async () => {
    const timerFactory = vi.fn();
    const { document } = await setup({ timerFactory });
    document.querySelector("#focus-duration").value = "";
    document.querySelector('[data-timer-action="start"]').click();
    expect(timerFactory).not.toHaveBeenCalled();
    expect(document.querySelector("#focus-status").textContent).toContain("valid whole numbers");
  });

  it("credits the captured duration and offers the configured break", async () => {
    const timers = [];
    const timerFactory = vi.fn((config) => {
      timers.push(config);
      return { start: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() };
    });
    const { document } = await setup({ timerFactory });
    document.querySelector('[data-timer-action="start"]').click();
    document.querySelector("#focus-duration").value = "180";
    timers[0].onComplete();

    expect(document.querySelector("#focused-minutes").textContent).toBe("25");
    expect(document.querySelector('[data-timer-action="start"]').textContent).toBe("Start break");
    expect(document.querySelector("#timer").textContent).toBe("05:00");

    document.querySelector('[data-timer-action="start"]').click();
    expect(timerFactory.mock.calls[1][0].durationSeconds).toBe(300);
    timers[1].onComplete();
    expect(document.querySelector("#focused-minutes").textContent).toBe("25");
  });

  it("continues in memory when browser storage rejects writes", async () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("denied"); } };
    const timerFactory = vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() }));
    const { document } = await setup({ timerFactory }, storage);
    document.querySelector('[data-timer-action="start"]').click();
    expect(timerFactory).toHaveBeenCalledOnce();
    expect(document.querySelector("#focus-status").textContent).toContain("will remain in this tab");
  });

  it("starts a named session without creating a second start path", async () => {
    const source = await readFile(`${projectRoot}/focus.html`, "utf8");
    const dom = new JSDOM(source, { url: "https://reps.test/focus.html" });
    const { document } = dom.window;
    initFocusPage(document, dom.window.localStorage);
    document.querySelector("#task").value = "Revise database notes";

    document.querySelector('[data-timer-action="start"]').click();

    expect(document.querySelector('[data-timer-action="start"]').disabled).toBe(true);
    expect(document.querySelector('[data-timer-action="pause"]').disabled).toBe(false);
    expect(document.querySelector("#focus-status").textContent).toContain("Revise database notes");
    document.querySelector('[data-timer-action="stop"]').click();
  });
});
