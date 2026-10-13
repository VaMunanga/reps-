function showStatic(root) {
  root.documentElement.dataset.motion = "static";
  root.querySelectorAll("[data-reveal], [data-motion-image]").forEach((element) => {
    element.style.opacity = "1";
    element.style.transform = "none";
  });
}

export function initMotion({
  root = document,
  gsap = globalThis.gsap,
  reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
} = {}) {
  if (reduceMotion || !gsap) {
    showStatic(root);
    return;
  }

  root.documentElement.dataset.motion = "active";
  const scrollTrigger = globalThis.ScrollTrigger;
  if (scrollTrigger && typeof gsap.registerPlugin === "function") {
    gsap.registerPlugin(scrollTrigger);
  }

  gsap.context(() => {
    const reveals = [...root.querySelectorAll("[data-reveal]")];
    reveals.forEach((element, index) => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay: Math.min(index, 3) * 0.06,
          ease: "power3.out",
          ...(scrollTrigger ? { scrollTrigger: { trigger: element, start: "top 86%", once: true } } : {}),
        },
      );
    });

    root.querySelectorAll("[data-motion-image]").forEach((image) => {
      gsap.fromTo(
        image,
        { opacity: 0.72, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
          ...(scrollTrigger ? { scrollTrigger: { trigger: image, start: "top 88%", once: true } } : {}),
        },
      );
    });

    root.querySelectorAll("[data-ambient]").forEach((element) => {
      gsap.to(element, { xPercent: 4, yPercent: -3, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
    });

    if (scrollTrigger) {
      const cards = [...root.querySelectorAll("[data-stack]")];
      cards.slice(0, -1).forEach((card, index) => {
        scrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cards.at(-1),
          end: "top top",
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
        const inner = card.querySelector(".stack-card-inner");
        if (inner) {
          gsap.to(inner, {
            opacity: 0.58,
            scale: 0.94,
            ease: "none",
            scrollTrigger: {
              trigger: cards[index + 1],
              start: "top bottom",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }
  }, root.body);
}

if (typeof document !== "undefined") {
  initMotion({ root: document });
}
