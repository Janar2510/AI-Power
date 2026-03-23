(function () {
  function escHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escNavHtml(v) {
    return escHtml(v);
  }

  function sidebarAbbrev(name) {
    var txt = String(name || "").trim();
    if (!txt) return "?";
    var parts = txt.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return txt.slice(0, 2).toUpperCase();
  }

  function parseActionDomain(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function parseFilterDomain(raw, uid) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    var txt = String(raw).trim();
    if (!txt) return [];
    try {
      return JSON.parse(txt);
    } catch (e) {
      // common Odoo-style domain strings often include uid variable
      try {
        var replaced = txt.replace(/\buid\b/g, String(uid == null ? 1 : uid));
        return JSON.parse(replaced.replace(/'/g, '"'));
      } catch (_e) {
        return [];
      }
    }
  }

  function parseCSV(text) {
    var src = String(text || "");
    var rows = [];
    var row = [];
    var cur = "";
    var quoted = false;
    for (var i = 0; i < src.length; i += 1) {
      var ch = src[i];
      if (quoted) {
        if (ch === '"') {
          if (src[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch !== "\r") {
        cur += ch;
      }
    }
    if (cur.length || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  }

  function pad2(v) {
    var n = parseInt(v, 10) || 0;
    return n < 10 ? "0" + n : String(n);
  }

  function floatHoursToTime(value) {
    var f = Number(value || 0);
    var h = Math.floor(Math.abs(f));
    var m = Math.round((Math.abs(f) - h) * 60);
    var sign = f < 0 ? "-" : "";
    return sign + h + ":" + pad2(m);
  }

  function renderSkeletonHtml(lineCount, shortLast) {
    var count = Math.max(1, parseInt(lineCount || 3, 10));
    var html = '<div class="o-ai-skeleton-wrap" aria-hidden="true">';
    for (var i = 0; i < count; i += 1) {
      var cls = "o-ai-skeleton-line";
      if (shortLast && i === count - 1) cls += " o-ai-skeleton-line--short";
      html += '<div class="' + cls + '"><div class="o-ai-skeleton"></div></div>';
    }
    html += "</div>";
    return html;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.Helpers = {
    escHtml: escHtml,
    escNavHtml: escNavHtml,
    sidebarAbbrev: sidebarAbbrev,
    parseActionDomain: parseActionDomain,
    parseFilterDomain: parseFilterDomain,
    parseCSV: parseCSV,
    pad2: pad2,
    floatHoursToTime: floatHoursToTime,
    renderSkeletonHtml: renderSkeletonHtml,
  };
})();
