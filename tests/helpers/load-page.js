import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const helperDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(helperDirectory, "../..");

export const productionPages = [
  "index.php",
  "about.html",
  "focus.html",
  "discussions.html",
  "gallery.html",
  "join.html",
  "practice.html",
];

export async function loadPage(relativePath) {
  const source = await readFile(path.join(projectRoot, relativePath), "utf8");
  return new JSDOM(source, { url: `https://reps.test/${relativePath}` }).window.document;
}

export async function localAssetExists(pagePath, reference) {
  if (!reference || /^(?:[a-z]+:|#)/i.test(reference)) return true;

  const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const target = cleanReference.startsWith("/")
    ? path.join(projectRoot, cleanReference.slice(1))
    : path.resolve(projectRoot, path.dirname(pagePath), cleanReference);

  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}
