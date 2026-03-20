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

  function parseCsv(text) {
    text = text || "";
    var rows = [];
    var cur = [];
    var cell = "";
    var i = 0;
    var inQ = false;
    while (i < text.length) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i += 2;
            continue;
          }
          inQ = false;
          i++;
          continue;
        }
        cell += ch;
        i++;
        continue;
      }
      if (ch === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (ch === ",") {
        cur.push(cell);
        cell = "";
        i++;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
        i++;
        continue;
      }
      cell += ch;
      i++;
    }
    cur.push(cell);
    if (cur.length > 1 || (cur.length === 1 && cur[0] !== "")) rows.push(cur);
    return rows;
  }

  function runBatchImport(rpc, model, headers, rows, fieldByColIndex) {
    if (!rpc || !model || !headers || !rows.length) return Promise.resolve({ created: 0, errors: [] });
    var objects = [];
    var errors = [];
    rows.forEach(function (row, ri) {
      var vals = {};
      headers.forEach(function (_h, ci) {
        var fn = fieldByColIndex[ci];
        if (!fn) return;
        vals[fn] = row[ci] != null ? row[ci] : "";
      });
      if (Object.keys(vals).length) objects.push(vals);
      else errors.push({ row: ri + 1, message: "No mapped fields" });
    });
    if (!objects.length) return Promise.resolve({ created: 0, errors: errors });
    var keys = Object.keys(objects[0]);
    var matrix = objects.map(function (o) {
      return keys.map(function (k) {
        return o[k];
      });
    });
    /* No semicolon before .then — ASI would break the chain and yield "Unexpected token '.'". */
    return rpc.callKw(model, "import_data", [keys, matrix], {})
      .then(function (res) {
        return { created: (res && res.created) || 0, errors: (res && res.errors) || errors };
      })
      .catch(function (e) {
        errors.push({ row: 0, message: (e && e.message) || "import failed" });
        return { created: 0, errors: errors };
      });
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.Import = { renderPreview: renderPreview, parseCsv: parseCsv, runBatchImport: runBatchImport };
})();
