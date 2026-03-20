/**
 * One2many inline table component (Phase 391).
 */
(function () {
  function renderHTML(columns, rows) {
    var html = '<div class="o-o2m-table-wrap"><table class="o-o2m-table"><thead><tr>';
    (columns || []).forEach(function (c) {
      html += "<th>" + String(c || "").replace(/</g, "&lt;") + "</th>";
    });
    html += '<th></th></tr></thead><tbody>';
    (rows || []).forEach(function (r, idx) {
      html += '<tr data-row-index="' + idx + '">';
      (columns || []).forEach(function (c) {
        html += "<td>" + String((r && r[c]) || "").replace(/</g, "&lt;") + "</td>";
      });
      html += '<td><button type="button" class="o-o2m-remove">Remove</button></td></tr>';
    });
    html += '</tbody></table><button type="button" class="o-o2m-add">Add line</button></div>';
    return html;
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.One2many = { renderHTML: renderHTML };
})();
