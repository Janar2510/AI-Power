(function () {
  function open(url, title) {
    var safeUrl = String(url || "").trim();
    if (!safeUrl) return null;
    var prevFocus = document.activeElement;
    var host = document.createElement("div");
    host.className = "o-report-preview";
    host.innerHTML =
      '<div class="o-report-preview-backdrop"></div>' +
      '<div class="o-report-preview-card" role="dialog" aria-modal="true" aria-label="' +
      String(title || "PDF Preview").replace(/"/g, "&quot;") +
      '" tabindex="-1">' +
      '<div class="o-report-preview-head"><h3>' +
      String(title || "PDF Preview").replace(/</g, "&lt;") +
      '</h3><button type="button" class="o-btn o-btn-secondary o-report-preview-close">Close</button></div>' +
      '<div class="o-report-preview-body"><iframe class="o-report-preview-frame" title="PDF Preview"></iframe></div>' +
      "</div>";
    document.body.appendChild(host);
    var frame = host.querySelector(".o-report-preview-frame");
    if (frame) frame.src = safeUrl;
    function close() {
      document.removeEventListener("keydown", onDocKey, true);
      host.remove();
      if (prevFocus && typeof prevFocus.focus === "function") {
        try {
          prevFocus.focus();
        } catch (e) {}
      }
    }
    function onDocKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onDocKey, true);
    var closeBtn = host.querySelector(".o-report-preview-close");
    if (closeBtn) closeBtn.onclick = close;
    var backdrop = host.querySelector(".o-report-preview-backdrop");
    if (backdrop) backdrop.onclick = close;
    var card = host.querySelector(".o-report-preview-card");
    if (card) {
      window.requestAnimationFrame(function () {
        try {
          closeBtn.focus();
        } catch (e) {}
      });
    }
    return { close: close };
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.PdfViewer = {
    open: open,
  };
})();
