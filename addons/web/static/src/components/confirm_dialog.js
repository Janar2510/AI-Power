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

  function openModal(opts) {
    opts = opts || {};
    var title = opts.title || "Dialog";
    var breadcrumbs = Array.isArray(opts.breadcrumbs) ? opts.breadcrumbs : [];
    var bodyHtml = opts.bodyHtml || "";
    var onClose = typeof opts.onClose === "function" ? opts.onClose : function () {};

    var overlay = document.createElement("div");
    overlay.className = "o-dialog-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "o-modal-dialog-title");

    var panel = document.createElement("div");
    panel.className = "o-dialog-panel";
    panel.style.maxWidth = "960px";
    panel.style.width = "90vw";

    var h = document.createElement("h3");
    h.id = "o-modal-dialog-title";
    h.className = "o-dialog-title";
    h.textContent = title;

    var crumbs = document.createElement("div");
    crumbs.className = "o-dialog-breadcrumbs";
    crumbs.style.marginBottom = "var(--space-sm)";
    if (breadcrumbs.length) {
      crumbs.innerHTML = breadcrumbs
        .map(function (c) { return '<span class="o-filter-chip">' + String(c || "").replace(/</g, "&lt;") + "</span>"; })
        .join(' <span style="color:var(--text-muted)">/</span> ');
    }

    var body = document.createElement("div");
    body.className = "o-dialog-body-html";
    body.innerHTML = bodyHtml;

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "o-btn o-btn-secondary";
    closeBtn.textContent = opts.closeLabel || "Close";
    closeBtn.style.marginTop = "var(--space-sm)";

    function cleanup() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
      }
    }
    closeBtn.onclick = cleanup;
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) cleanup();
    });

    panel.appendChild(h);
    panel.appendChild(crumbs);
    panel.appendChild(body);
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    return {
      close: cleanup,
      root: overlay,
      panel: panel,
      body: body,
      setBodyHtml: function (html) { body.innerHTML = html || ""; },
      setBreadcrumbs: function (items) {
        var arr = Array.isArray(items) ? items : [];
        crumbs.innerHTML = arr
          .map(function (c) { return '<span class="o-filter-chip">' + String(c || "").replace(/</g, "&lt;") + "</span>"; })
          .join(' <span style="color:var(--text-muted)">/</span> ');
      },
    };
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.ConfirmDialog = { confirm: confirm, openModal: openModal };
})();
