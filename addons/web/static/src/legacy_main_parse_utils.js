/**
 * Legacy: domain + CSV helpers shared by list/import flows.
 */
(function () {
  var P = (window.__ERP_PARSE_UTILS = window.__ERP_PARSE_UTILS || {});

  P.parseActionDomain = function (s) {
    if (!s || typeof s !== 'string') return [];
    var t = s.trim();
    if (!t) return [];
    try {
      var parsed = JSON.parse(t.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  P.parseFilterDomain = function (s, uid) {
    if (!s || typeof s !== 'string') return [];
    var t = s.trim();
    if (!t) return [];
    if (uid != null && typeof uid === 'number') {
      t = t.replace(/\buid\b/g, String(uid));
    }
    try {
      var json = t.replace(/\(/g, '[').replace(/\)/g, ']').replace(/'/g, '"');
      var parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  P.parseCSV = function (text) {
    var rows = [];
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var row = [];
      var cur = '';
      var inQuotes = false;
      for (var j = 0; j < line.length; j++) {
        var c = line[j];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
          row.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      row.push(cur.trim());
      if (row.some(function (c) { return c; })) rows.push(row);
    }
    return rows;
  };
})();
