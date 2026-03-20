(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.Modal = function Modal(options) {
    const opts = options || {};
    const overlay = document.createElement("div");
    overlay.className = "o-modal";

    const card = document.createElement("div");
    card.className = "o-modal-card";

    const title = document.createElement("h3");
    title.textContent = String(opts.title || "Dialog");

    const body = document.createElement("div");
    body.className = "o-modal-body";
    if (opts.body instanceof Node) {
      body.appendChild(opts.body);
    } else {
      body.textContent = String(opts.body || "");
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "o-btn o-btn-secondary";
    close.textContent = "Close";
    close.addEventListener("click", function () {
      overlay.remove();
      if (typeof opts.onClose === "function") {
        opts.onClose();
      }
    });

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(close);
    overlay.appendChild(card);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        close.click();
      }
    });

    return overlay;
  };
})();
