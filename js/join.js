function clearErrors(form) {
  form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll("[data-error-for]").forEach((element) => { element.textContent = ""; });
}

function ensureErrorSlots(form) {
  const seen = new Set();
  [...form.elements].filter((field) => field.name && field.type !== "submit").forEach((field) => {
    const name = field.name.replace(/\[\]$/, "");
    if (seen.has(name)) return;
    seen.add(name);
    if (form.querySelector(`[data-error-for="${name}"]`)) return;
    const error = form.ownerDocument.createElement("span");
    error.className = "field-error";
    error.dataset.errorFor = name;
    error.id = `error-${name.replaceAll("_", "-")}`;
    const related = [...form.querySelectorAll(`[name="${field.name}"]`)];
    related.forEach((control) => {
      const descriptions = new Set((control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
      descriptions.add(error.id);
      control.setAttribute("aria-describedby", [...descriptions].join(" "));
    });
    const group = field.name.endsWith("[]") ? field.closest("fieldset") : null;
    (group ?? field).insertAdjacentElement("afterend", error);
  });
}

function showFieldErrors(form, errors = {}) {
  let firstInvalid = null;
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements.namedItem(name) ?? form.elements.namedItem(`${name}[]`);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    const fields = field instanceof form.ownerDocument.defaultView.RadioNodeList ? [...field] : [field].filter(Boolean);
    fields.forEach((control) => control.setAttribute("aria-invalid", "true"));
    if (!firstInvalid) firstInvalid = fields[0] ?? null;
    if (error) error.textContent = String(message);
  });
  firstInvalid?.focus();
}

export function initJoinForm(form, fetchImpl = globalThis.fetch) {
  if (!form || form.dataset.enhanced === "true") return;
  form.dataset.enhanced = "true";
  form.action = form.getAttribute("action") || "api/join.php";
  form.method = "post";
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("#join-status");
  const defaultLabel = button.textContent;
  button.disabled = false;
  ensureErrorSlots(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(form);
    if (!form.checkValidity()) {
      status.textContent = "Complete the required fields before submitting.";
      form.reportValidity();
      return;
    }

    button.disabled = true;
    button.textContent = "Saving interest";
    status.textContent = "Saving your interest securely.";
    try {
      const response = await fetchImpl(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new form.ownerDocument.defaultView.FormData(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        showFieldErrors(form, payload.errors);
        status.textContent = payload.message || "We could not save your interest. Please try again.";
        return;
      }
      form.reset();
      status.textContent = payload.message || "Interest saved.";
    } catch {
      status.textContent = "Connection failed. Check your network and try again.";
    } finally {
      button.disabled = false;
      button.textContent = defaultLabel;
    }
  });
}

if (typeof document !== "undefined") initJoinForm(document.querySelector("#join-form"));
