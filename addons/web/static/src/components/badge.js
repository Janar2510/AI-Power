(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.Badge = function Badge(options) {
    const opts = typeof options === "string" ? { label: options } : (options || {});
    const badge = document.createElement("span");
    badge.className = "o-badge o-badge-" + (opts.variant || "info");
    badge.textContent = String(opts.label || "");
    if (opts.removable) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "o-badge-close";
      close.textContent = "x";
      close.setAttribute("aria-label", "Remove badge");
      if (typeof opts.onRemove === "function") {
        close.addEventListener("click", opts.onRemove);
      }
      badge.appendChild(close);
    }
    return badge;
  };
})();
