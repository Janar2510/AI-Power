(function () {
  window.UIComponents = window.UIComponents || {};
  let host;

  function ensureHost() {
    if (host) {
      return host;
    }
    host = document.createElement("div");
    host.className = "o-toast-host";
    document.body.appendChild(host);
    return host;
  }

  window.UIComponents.Toast = function Toast(options) {
    const opts = typeof options === "string" ? { message: options } : (options || {});
    const toast = document.createElement("div");
    toast.className = "o-toast o-toast-" + (opts.type || "info");
    toast.textContent = String(opts.message || "");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "o-toast-close";
    close.textContent = "x";
    close.addEventListener("click", function () {
      toast.remove();
    });
    toast.appendChild(close);

    ensureHost().appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, Number(opts.duration || 3500));

    return toast;
  };
})();
