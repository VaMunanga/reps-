export function initSiteShell(root = document, year = new Date().getFullYear()) {
  root.documentElement.dataset.enhanced = "true";
  root.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(year);
  });
}

if (typeof document !== "undefined") {
  initSiteShell(document);
}
