(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.Button = function Button(options) {
    const opts = typeof options === "string" ? { label: options } : (options || {});
    const kind = opts.kind || "primary";

    const button = document.createElement("button");
    button.type = opts.type || "button";
    button.className = "o-btn o-btn-" + kind;
    button.textContent = String(opts.label || "");

    if (opts.disabled) {
      button.disabled = true;
    }
    if (opts.loading) {
      button.dataset.loading = "true";
      button.setAttribute("aria-busy", "true");
    }
    if (opts.icon) {
      button.setAttribute("data-icon", String(opts.icon));
    }
    if (typeof opts.onClick === "function") {
      button.addEventListener("click", opts.onClick);
    }
    return button;
  };
})();
