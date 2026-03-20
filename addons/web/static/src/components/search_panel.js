/**
 * Search panel component (Phase 399).
 */
(function () {
  function renderHTML(sections) {
    var html = '<aside class="o-search-panel" aria-label="Search panel">';
    (sections || []).forEach(function (sec) {
      html += '<section class="o-search-panel-section"><h4>' + String(sec.title || "").replace(/</g, "&lt;") + "</h4><ul>";
      (sec.items || []).forEach(function (it) {
        html += '<li><button type="button" class="o-search-panel-item" data-value="' + String(it.value || "").replace(/"/g, "&quot;") + '">' + String(it.label || "").replace(/</g, "&lt;") + "</button></li>";
      });
      html += "</ul></section>";
    });
    html += "</aside>";
    return html;
  }
  window.UIComponents = window.UIComponents || {};
  window.UIComponents.SearchPanel = { renderHTML: renderHTML };
})();
