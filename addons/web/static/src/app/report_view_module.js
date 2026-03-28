/**
 * Phase 778: Report viewer shell — HTML report in iframe + PDF shortcut.
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function render(main, opts) {
    opts = opts || {};
    if (!main) return false;
    var report = esc(opts.reportName || opts.name || "Report");
    var ids = opts.ids || opts.resIds || [];
    var idStr = Array.isArray(ids) && ids.length ? ids.join(",") : opts.resId != null ? String(opts.resId) : "";
    var htmlUrl =
      opts.reportUrl ||
      (opts.reportName && idStr ? "/report/html/" + encodeURIComponent(String(opts.reportName)) + "/" + idStr : "");
    var pdfUrl =
      opts.pdfUrl ||
      (opts.reportName && idStr ? "/report/pdf/" + encodeURIComponent(String(opts.reportName)) + "/" + idStr : "");
    var body =
      '<section class="o-report-view-module o-card-gradient" style="padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-md);min-height:60vh">' +
      "<h2>" +
      report +
      "</h2>" +
      '<p class="o-report-actions" style="display:flex;gap:var(--card-gap);flex-wrap:wrap">';
    if (htmlUrl) {
      body +=
        '<a class="o-btn o-btn-secondary" href="' +
        esc(htmlUrl) +
        '" target="_blank" rel="noopener">Open HTML</a>';
    }
    if (pdfUrl) {
      body +=
        '<a class="o-btn o-btn-secondary" href="' +
        esc(pdfUrl) +
        '" target="_blank" rel="noopener">Download PDF</a>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-report-preview-pdf">Preview PDF</button>';
    }
    body += "</p>";
    if (htmlUrl) {
      body +=
        '<iframe class="o-report-iframe" title="' +
        report +
        '" src="' +
        esc(htmlUrl) +
        '" style="flex:1;min-height:24rem;width:100%;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1)"></iframe>';
    } else {
      body += '<p style="color:var(--text-muted)">Provide <code>reportName</code> and <code>ids</code> / <code>resId</code> or a full <code>reportUrl</code>.</p>';
    }
    body += "</section>";
    main.innerHTML = body;
    var prevBtn = main.querySelector("#o-report-preview-pdf");
    if (prevBtn && pdfUrl && window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === "function") {
      prevBtn.onclick = function () {
        window.UIComponents.PdfViewer.open(pdfUrl, report);
      };
    }
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.ReportViewModule = { render: render };
})();
