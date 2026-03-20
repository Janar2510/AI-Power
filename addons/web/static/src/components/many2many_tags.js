/**
 * Many2many tags editor (Phase 391/395).
 */
(function () {
  function renderHTML(tags) {
    var html = '<div class="o-m2m-tags">';
    (tags || []).forEach(function (t) {
      var id = String(t.id || "");
      var name = String(t.name || t.display_name || id).replace(/</g, "&lt;");
      html += '<span class="o-m2m-tag" data-id="' + id.replace(/"/g, "&quot;") + '">' + name + '<button type="button" class="o-m2m-tag-remove" aria-label="Remove">&times;</button></span>';
    });
    html += '<button type="button" class="o-m2m-tag-add">Add</button></div>';
    return html;
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.Many2manyTags = { renderHTML: renderHTML };
})();
