import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { initMotion } from "../js/motion.js";

function motionDocument() {
  return new JSDOM(`
    <main>
      <section data-reveal>First</section>
      <section data-reveal>Second</section>
      <div data-ambient></div>
      <img data-motion-image alt="Brand board">
    </main>
  `).window.document;
}

describe("initMotion", () => {
  it("uses an immediate static end state for reduced motion", () => {
    const root = motionDocument();

    initMotion({ root, gsap: undefined, reduceMotion: true });

    expect(root.documentElement.dataset.motion).toBe("static");
    root.querySelectorAll("[data-reveal], [data-motion-image]").forEach((element) => {
      expect(element.style.opacity).toBe("1");
      expect(element.style.transform).toBe("none");
    });
  });

  it("keeps content visible when GSAP is unavailable", () => {
    const root = motionDocument();

    expect(() => initMotion({ root, gsap: undefined, reduceMotion: false })).not.toThrow();
    expect(root.documentElement.dataset.motion).toBe("static");
    expect(root.querySelector("[data-reveal]").style.opacity).toBe("1");
  });

  it("limits animated properties to transforms and opacity", () => {
    const root = motionDocument();
    const calls = [];
    const gsap = {
      fromTo: vi.fn((target, from, to) => calls.push({ from, to })),
      to: vi.fn((target, to) => calls.push({ to })),
      registerPlugin: vi.fn(),
      context: vi.fn((callback) => {
        callback();
        return { revert: vi.fn() };
      }),
    };

    initMotion({ root, gsap, reduceMotion: false });

    expect(root.documentElement.dataset.motion).toBe("active");
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      for (const values of [call.from, call.to].filter(Boolean)) {
        expect(values).not.toHaveProperty("top");
        expect(values).not.toHaveProperty("left");
        expect(values).not.toHaveProperty("width");
        expect(values).not.toHaveProperty("height");
      }
    }
  });
});
