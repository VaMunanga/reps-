import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadPage,
  localAssetExists,
  projectRoot,
  productionPages,
} from "./helpers/load-page.js";

describe("production page contract", () => {
  it("serves the root homepage through PHP and retires the HTML duplicate", async () => {
    await expect(access(path.join(projectRoot, "index.php"))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, "index.html"))).rejects.toThrow();
  });

  it("uses a unique, descriptive title on every page", async () => {
    const titles = [];

    for (const page of productionPages) {
      const document = await loadPage(page);
      const title = document.querySelector("title")?.textContent.trim() ?? "";
      expect(title, `${page} title`).toMatch(/REPS/i);
      expect(title.length, `${page} title length`).toBeGreaterThan(10);
      titles.push(title);
    }

    expect(new Set(titles).size).toBe(productionPages.length);
  });

  describe.each(productionPages)("%s", (page) => {
    it("has metadata and one reachable main landmark", async () => {
      const document = await loadPage(page);
      const description = document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim();
      const main = document.querySelectorAll("main");
      const skipLink = document.querySelector(".skip-link");

      expect(description?.length).toBeGreaterThan(30);
      expect(main).toHaveLength(1);
      expect(main[0].id).toBe("main-content");
      expect(skipLink?.getAttribute("href")).toBe("#main-content");
    });

    it("identifies exactly one current header destination", async () => {
      const document = await loadPage(page);
      expect(document.querySelectorAll('.site-header a[aria-current="page"]')).toHaveLength(1);
    });

    it("loads a shared JavaScript module", async () => {
      const document = await loadPage(page);
      const sharedModule = document.querySelector('script[type="module"][src="js/site.js"]');
      expect(sharedModule).not.toBeNull();
    });

    it("uses the shared atmospheric shell hooks", async () => {
      const document = await loadPage(page);

      expect(document.querySelector(".site-header")).not.toBeNull();
      expect(document.querySelector(".site-nav")).not.toBeNull();
      expect(document.querySelector(".section-shell")).not.toBeNull();
      expect(document.querySelector(".site-footer")).not.toBeNull();
    });

    it("does not link to the retired HTML homepage", async () => {
      const document = await loadPage(page);
      expect(document.querySelector('a[href="index.html"]')).toBeNull();
    });

    it("does not publish prototype or coming-soon copy", async () => {
      const document = await loadPage(page);
      const visibleCopy = document.body.textContent.replace(/\s+/g, " ");
      expect(visibleCopy).not.toMatch(/coming soon|day\s+\d|will be connected/i);
    });

    it("references only local files that exist", async () => {
      const document = await loadPage(page);
      const references = [
        ...document.querySelectorAll("a[href], link[href], script[src], img[src]"),
      ].map((element) => element.getAttribute("href") ?? element.getAttribute("src"));

      for (const reference of references) {
        expect(
          await localAssetExists(page, reference),
          `${page} references missing file ${reference}`,
        ).toBe(true);
      }
    });
  });
});
