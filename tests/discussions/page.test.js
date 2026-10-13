import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initDiscussionsPage } from "../../js/discussions/page.js";
import { projectRoot } from "../helpers/load-page.js";

async function setup() {
  const source = await readFile(`${projectRoot}/discussions.html`, "utf8");
  const dom = new JSDOM(source, { url: "https://reps.test/discussions.html" });
  initDiscussionsPage(dom.window.document, dom.window.localStorage);
  return dom.window;
}

describe("Discussions page", () => {
  it("renders all proposed formats and filters by category", async () => {
    const window = await setup();
    const { document } = window;
    expect(document.querySelectorAll("[data-discussion-id]")).toHaveLength(4);
    const filter = document.querySelector("#discussion-category");
    filter.value = "Coding";
    filter.dispatchEvent(new window.Event("change", { bubbles: true }));
    expect(document.querySelectorAll("[data-discussion-id]")).toHaveLength(1);
  });

  it("records a local expression of interest and disables repeat joining", async () => {
    const { document } = await setup();
    const button = document.querySelector('[data-join-discussion="study-sprint"]');
    button.click();
    const updatedButton = document.querySelector('[data-join-discussion="study-sprint"]');
    expect(updatedButton.disabled).toBe(true);
    expect(updatedButton.textContent).toBe("Interest saved");
    expect(document.querySelector("#discussion-status").textContent).toContain("this device");
  });
});
