import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initFocusPage } from "../../js/focus/page.js";
import { projectRoot } from "../helpers/load-page.js";

describe("Focus page", () => {
  it("hydrates defaults and exposes the valid initial control state", async () => {
    const source = await readFile(`${projectRoot}/focus.html`, "utf8");
    const dom = new JSDOM(source, { url: "https://reps.test/focus.html" });

    initFocusPage(dom.window.document, dom.window.localStorage);

    expect(dom.window.document.querySelector("#timer").textContent).toBe("25:00");
    expect(dom.window.document.querySelector('[data-timer-action="start"]').disabled).toBe(false);
    expect(dom.window.document.querySelector('[data-timer-action="pause"]').disabled).toBe(true);
    expect(dom.window.document.querySelector("#focus-status").textContent).toBe("Ready when you are.");
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
