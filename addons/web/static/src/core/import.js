/**
 * AppCore.Import utilities (Phase 395).
 */
(function () {
  function renderPreview(headers, rows, modelFields) {
    headers = headers || [];
    rows = rows || [];
    modelFields = modelFields || [];
    if (!headers.length) return null;
    var preview = rows.slice(0, 5);
    var table = '<table class="o-import-preview-table"><tr>';
    headers.forEach(function (h) { table += "<th>" + String(h || "").replace(/</g, "&lt;") + "</th>"; });
    table += "</tr>";
    preview.forEach(function (row) {
      table += "<tr>";
      headers.forEach(function (_h, i) { table += "<td>" + String((row && row[i]) || "").replace(/</g, "&lt;") + "</td>"; });
      table += "</tr>";
    });
    table += "</table>";

    var mapping = '<table class="o-import-mapping-table"><tr><th>Column</th><th>Map to field</th></tr>';
    headers.forEach(function (h, i) {
      mapping += "<tr><td>" + String(h || "").replace(/</g, "&lt;") + '</td><td><select class="import-map-select" data-csv-idx="' + i + '">';
      mapping += '<option value="">-- Skip --</option>';
      modelFields.forEach(function (mf) { mapping += '<option value="' + String(mf || "").replace(/"/g, "&quot;") + '">' + String(mf || "").replace(/</g, "&lt;") + "</option>"; });
      mapping += "</select></td></tr>";
    });
    mapping += "</table>";
    return { table: table, mapping: mapping };
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.Import = { renderPreview: renderPreview };
})();
