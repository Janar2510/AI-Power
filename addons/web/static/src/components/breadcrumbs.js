/**
 * Breadcrumbs component (Phase 395).
 */
(function () {
  function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function renderHTML(stack) {
    if (!stack || stack.length <= 1) return "";
    var html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
    stack.forEach(function (entry, i) {
      if (i === stack.length - 1) {
        html += '<span class="breadcrumb-item active">' + esc(entry.label) + "</span>";
      } else {
        html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + i + '">' + esc(entry.label) + "</a><span class=\"breadcrumb-sep\">/</span>";
      }
    });
    html += "</nav>";
    return html;
  }
  window.UIComponents = window.UIComponents || {};
  window.UIComponents.Breadcrumbs = { renderHTML: renderHTML };
})();
