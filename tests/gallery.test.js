import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { createLightbox } from "../js/gallery.js";
import { projectRoot } from "./helpers/load-page.js";

function setup() {
  const dom = new JSDOM(`
    <button id="trigger">Open</button>
    <dialog><button id="close">Close</button></dialog>
  `, { pretendToBeVisual: true });
  const { document } = dom.window;
  const dialog = document.querySelector("dialog");
  dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));
  dialog.close = vi.fn(() => dialog.removeAttribute("open"));
  const trigger = document.querySelector("#trigger");
  const closeButton = document.querySelector("#close");
  return { dom, document, dialog, trigger, closeButton };
}

describe("identity lightbox", () => {
  it("opens from the trigger and moves focus to close", () => {
    const parts = setup();
    createLightbox(parts);
    parts.trigger.click();
    expect(parts.dialog.showModal).toHaveBeenCalledOnce();
    expect(parts.document.activeElement).toBe(parts.closeButton);
  });

  it("closes explicitly and restores focus", () => {
    const parts = setup();
    createLightbox(parts);
    parts.trigger.click();
    parts.closeButton.click();
    expect(parts.dialog.close).toHaveBeenCalledOnce();
    expect(parts.document.activeElement).toBe(parts.trigger);
  });

  it("handles the native cancel event used by Escape", () => {
    const parts = setup();
    createLightbox(parts);
    parts.trigger.click();
    const event = new parts.dom.window.Event("cancel", { cancelable: true });
    parts.dialog.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(parts.dialog.close).toHaveBeenCalledOnce();
  });

  it("returns the same controller when initialized twice", () => {
    const parts = setup();
    expect(createLightbox(parts)).toBe(createLightbox(parts));
  });

  it("uses meaningful alternative text in the production gallery", async () => {
    const source = await readFile(`${projectRoot}/gallery.html`, "utf8");
    const document = new JSDOM(source).window.document;
    const image = document.querySelector(".identity-board img");
    expect(image.alt.length).toBeGreaterThan(50);
  });
});
