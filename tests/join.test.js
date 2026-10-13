import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { initJoinForm } from "../js/join.js";
import { projectRoot } from "./helpers/load-page.js";

async function setup(fetchImpl) {
  const source = await readFile(`${projectRoot}/join.html`, "utf8");
  const dom = new JSDOM(source, { url: "https://reps.test/join.html" });
  const form = dom.window.document.querySelector("#join-form");
  initJoinForm(form, fetchImpl);
  return { dom, form, document: dom.window.document };
}

function fillValid(form) {
  form.elements.full_name.value = "Vara Munanga";
  form.elements.email.value = "student@hit.ac.zw";
  form.elements.programme.value = "Computer Science";
  form.elements.year.value = "3";
  form.elements.goal.value = "Build a consistent study routine";
  form.elements.consent.checked = true;
}

async function submit(dom, form) {
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Join form", () => {
  it("keeps the server-rendered submit control available without JavaScript", async () => {
    const source = await readFile(`${projectRoot}/join.html`, "utf8");
    const dom = new JSDOM(source);
    expect(dom.window.document.querySelector('#join-form button[type="submit"]').disabled).toBe(false);
  });

  it("preserves a normal POST fallback and enables enhancement", async () => {
    const { form } = await setup(vi.fn());
    expect(form.method).toBe("post");
    expect(form.getAttribute("action")).toBe("api/join.php");
    expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it("stops invalid browser input before requesting the endpoint", async () => {
    const fetchImpl = vi.fn();
    const { dom, form, document } = await setup(fetchImpl);
    await submit(dom, form);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(document.querySelector("#join-status").textContent).toContain("required fields");
  });

  it("shows success and resets a valid submission", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, message: "Interest saved." }) });
    const { dom, form, document } = await setup(fetchImpl);
    fillValid(form);
    await submit(dom, form);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(document.querySelector("#join-status").textContent).toBe("Interest saved.");
    expect(form.elements.full_name.value).toBe("");
  });

  it("maps 422 field errors without reflecting unsafe input", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ ok: false, message: "Check the highlighted fields.", errors: { email: "Enter a valid email address." } }) });
    const { dom, form, document } = await setup(fetchImpl);
    fillValid(form);
    await submit(dom, form);
    expect(form.elements.email.getAttribute("aria-invalid")).toBe("true");
    expect(document.querySelector('[data-error-for="email"]').textContent).toBe("Enter a valid email address.");
  });

  it.each([
    [vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ ok: false, message: "We could not save your interest. Please try again." }) }), "We could not save"],
    [vi.fn().mockRejectedValue(new Error("offline")), "Connection failed"],
  ])("recovers from server and network failures", async (fetchImpl, expected) => {
    const { dom, form, document } = await setup(fetchImpl);
    fillValid(form);
    await submit(dom, form);
    expect(document.querySelector("#join-status").textContent).toContain(expected);
    expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
  });
});
