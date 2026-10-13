import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initSiteShell } from "../js/site.js";

describe("initSiteShell", () => {
  it("marks the document as enhanced and fills the current year", () => {
    const dom = new JSDOM('<span data-current-year></span>');
    const { document } = dom.window;

    initSiteShell(document, 2026);

    expect(document.documentElement.dataset.enhanced).toBe("true");
    expect(document.querySelector("[data-current-year]").textContent).toBe("2026");
  });

  it("is safe to initialize more than once", () => {
    const dom = new JSDOM('<span data-current-year></span>');
    const { document } = dom.window;

    initSiteShell(document, 2026);
    initSiteShell(document, 2026);

    expect(document.querySelectorAll("[data-current-year]")).toHaveLength(1);
    expect(document.documentElement.dataset.enhanced).toBe("true");
  });
});
