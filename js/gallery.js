const instances = new WeakMap();

export function createLightbox({ dialog, trigger, closeButton }) {
  if (instances.has(dialog)) return instances.get(dialog);

  function open() {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeButton.focus();
  }

  function close() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    trigger.focus();
  }

  function cancel(event) {
    event.preventDefault();
    close();
  }

  function destroy() {
    trigger.removeEventListener("click", open);
    closeButton.removeEventListener("click", close);
    dialog.removeEventListener("cancel", cancel);
    instances.delete(dialog);
  }

  trigger.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  dialog.addEventListener("cancel", cancel);
  const controller = { open, close, destroy };
  instances.set(dialog, controller);
  return controller;
}

if (typeof document !== "undefined") {
  const dialog = document.querySelector("#identity-lightbox");
  const trigger = document.querySelector("#identity-lightbox-trigger");
  const closeButton = document.querySelector("#identity-lightbox-close");
  if (dialog && trigger && closeButton) createLightbox({ dialog, trigger, closeButton });
}
