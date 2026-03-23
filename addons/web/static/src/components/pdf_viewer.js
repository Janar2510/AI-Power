(function () {
  function open(url, title) {
    var safeUrl = String(url || "").trim();
    if (!safeUrl) return null;
    var host = document.createElement("div");
    host.className = "o-report-preview";
    host.innerHTML =
      '<div class="o-report-preview-backdrop"></div>' +
      '<div class="o-report-preview-card" role="dialog" aria-modal="true">' +
      '<div class="o-report-preview-head"><h3>' + String(title || "PDF Preview").replace(/</g, "&lt;") + '</h3><button type="button" class="o-btn o-btn-secondary o-report-preview-close">Close</button></div>' +
      '<div class="o-report-preview-body"><iframe class="o-report-preview-frame" title="PDF Preview"></iframe></div>' +
      "</div>";
    document.body.appendChild(host);
    var frame = host.querySelector(".o-report-preview-frame");
    if (frame) frame.src = safeUrl;
    function close() {
      host.remove();
    }
    var closeBtn = host.querySelector(".o-report-preview-close");
    if (closeBtn) closeBtn.onclick = close;
    var backdrop = host.querySelector(".o-report-preview-backdrop");
    if (backdrop) backdrop.onclick = close;
    return { close: close };
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.PdfViewer = {
    open: open,
  };
})();
