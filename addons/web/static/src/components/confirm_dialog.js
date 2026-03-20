/**
 * Modal confirm dialog (Phase 1c) — design tokens, async Promise API.
 */
(function () {
  function confirm(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var title = opts.title || "Confirm";
      var message = opts.message || opts.body || "Are you sure?";
      var confirmLabel = opts.confirmLabel || "OK";
      var cancelLabel = opts.cancelLabel || "Cancel";

      var overlay = document.createElement("div");
      overlay.className = "o-dialog-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "o-confirm-dialog-title");

      var panel = document.createElement("div");
      panel.className = "o-dialog-panel";

      var h = document.createElement("h3");
      h.id = "o-confirm-dialog-title";
      h.className = "o-dialog-title";
      h.textContent = title;

      var p = document.createElement("p");
      p.className = "o-dialog-body";
      p.textContent = message;

      var actions = document.createElement("div");
      actions.className = "o-dialog-actions";

      function cleanup(result) {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        resolve(!!result);
      }

      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          cleanup(false);
        }
      }

      var btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "o-btn o-btn-secondary";
      btnCancel.textContent = cancelLabel;
      btnCancel.onclick = function () {
        cleanup(false);
      };

      var btnOk = document.createElement("button");
      btnOk.type = "button";
      btnOk.className = "o-btn o-btn-primary";
      btnOk.textContent = confirmLabel;
      btnOk.onclick = function () {
        cleanup(true);
      };

      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      panel.appendChild(h);
      panel.appendChild(p);
      panel.appendChild(actions);
      overlay.appendChild(panel);

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(false);
      });

      document.addEventListener("keydown", onKey);
      document.body.appendChild(overlay);
      btnOk.focus();
    });
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.ConfirmDialog = { confirm: confirm };
})();
