/**
 * Field widget registry — Odoo-style widget name -> HTML for form fields (Phase 5).
 */
(function () {
  var registry = {};

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function register(name, fn) {
    if (name && typeof fn === "function") registry[name] = fn;
  }

  /**
   * @param {string} model
   * @param {object} fieldDef — view field node { name, widget, ... }
   * @param {object} api — { getFieldLabel, getFieldMeta }
   * @returns {string|null} HTML fragment or null to fall back
   */
  function render(model, fieldDef, api) {
    var w = fieldDef && fieldDef.widget;
    if (!w || !registry[w]) return null;
    return registry[w](model, fieldDef, api || {});
  }

  register("color_picker", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var req = api.getFieldMeta && api.getFieldMeta(model, fname) && api.getFieldMeta(model, fname).required;
    return (
      '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' +
      esc(label) +
      (req ? " *" : "") +
      '</label><input type="color" name="' +
      esc(fname) +
      '" value="#4a9eff" class="o-field-color"></p>'
    );
  });

  register("badge", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="text" name="' +
      esc(fname) +
      '" class="o-field-badge-input" placeholder="Badge text"></p>'
    );
  });

  register("percentage", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var req = api.getFieldMeta && api.getFieldMeta(model, fname) && api.getFieldMeta(model, fname).required;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      (req ? " *" : "") +
      '</label><input type="number" name="' +
      esc(fname) +
      '" min="0" max="100" step="0.1" ' +
      (req ? "required " : "") +
      'class="o-field-input o-field-input--max12"></p>'
    );
  });

  register("progressbar", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div class="progressbar-widget o-field-progress">' +
      '<div class="o-field-progress-track">' +
      '<div class="progressbar-fill o-field-progress-fill"></div></div>' +
      '<input type="number" name="' +
      esc(fname) +
      '" min="0" max="100" step="0.1" class="o-field-input o-field-input--w4"></div></p>'
    );
  });

  register("signature", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div class="o-signature-widget o-field-mt-sm">' +
      '<canvas class="o-signature-canvas o-field-canvas" data-fname="' +
      esc(fname) +
      '" width="400" height="120"></canvas>' +
      '<div class="o-field-mt-xs"><button type="button" class="o-signature-clear o-btn o-btn-secondary" data-fname="' +
      esc(fname) +
      '">Clear</button></div>' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" value="" class="o-signature-data"></div></p>'
    );
  });

  register("domain", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><textarea name="' +
      esc(fname) +
      '" rows="4" placeholder="[[&quot;field&quot;, &quot;=&quot;, value]]" class="o-field-input o-field-input--textarea"></textarea></p>'
    );
  });

  register("priority", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var html = '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label>';
    html += '<span class="o-priority-widget">';
    for (var i = 1; i <= 3; i += 1) {
      html +=
        '<label><input type="radio" name="' +
        esc(fname) +
        '" value="' +
        i +
        '"><span class="o-priority-star" aria-hidden="true">★</span></label>';
    }
    html += "</span></p>";
    return html;
  });

  register("state_selection", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label>' +
      '<select name="' + esc(fname) + '" class="o-state-selection-select">' +
      '<option value="normal">● Normal</option><option value="warning">● Warning</option><option value="blocked">● Blocked</option></select></p>'
    );
  });

  register("handle", function (model, f) {
    return '<p class="attr-field" data-fname="' + esc(f.name) + '"><label>' + esc(f.string || f.name || "Handle") + '</label><span class="o-field-handle-pill">::</span></p>';
  });

  register("email", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="email" name="' + esc(fname) + '" class="o-field-input"></p>';
  });

  register("url", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="url" name="' + esc(fname) + '" placeholder="https://..." class="o-field-input"></p>';
  });

  register("phone", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="tel" name="' + esc(fname) + '" class="o-field-input"></p>';
  });

  register("copy_clipboard", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><div class="o-field-row"><input type="text" name="' + esc(fname) + '" class="o-field-row-input"><button type="button" class="o-btn o-btn-secondary" data-copy-field="' + esc(fname) + '">Copy</button></div></p>';
  });

  register("float_time", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="number" step="0.25" name="' + esc(fname) + '" placeholder="1.50" class="o-field-input o-field-input--w8"><small class="o-field-help">Hours in decimal format</small></p>';
  });

  register("radio", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var options = (api.getSelectionOptions && api.getSelectionOptions(model, fname)) || [];
    var html = '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><span class="o-field-row o-field-row--wrap">';
    options.forEach(function (opt, i) {
      html += '<label><input type="radio" name="' + esc(fname) + '" value="' + esc(opt[0]) + '"' + (i === 0 ? " checked" : "") + "> " + esc(opt[1]) + "</label>";
    });
    html += "</span></p>";
    return html;
  });

  register("many2many_checkboxes", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><div class="o-m2m-checkboxes o-field-m2m-grid"><label><input type="checkbox" name="' + esc(fname) + '" value="1"> Option 1</label><label><input type="checkbox" name="' + esc(fname) + '" value="2"> Option 2</label><label><input type="checkbox" name="' + esc(fname) + '" value="3"> Option 3</label></div></p>';
  });

  /** Phase 774 / 1.246 H4: class-based field controls (see webclient.css .o-field-*) */
  register("char", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var req = api.getFieldMeta && api.getFieldMeta(model, fname) && api.getFieldMeta(model, fname).required;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      (req ? " *" : "") +
      '</label><input type="text" name="' +
      esc(fname) +
      '" ' +
      (req ? "required " : "") +
      'class="o-field-input"></p>'
    );
  });
  register("text", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><textarea name="' +
      esc(fname) +
      '" rows="4" class="o-field-input o-field-input--textarea"></textarea></p>'
    );
  });
  register("integer", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="number" step="1" name="' +
      esc(fname) +
      '" class="o-field-input o-field-input--max12"></p>'
    );
  });
  register("float", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="number" step="any" name="' +
      esc(fname) +
      '" class="o-field-input o-field-input--max12"></p>'
    );
  });
  register("boolean", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label><input type="checkbox" name="' +
      esc(fname) +
      '" value="1" class="o-field-checkbox-gap">' +
      esc(label) +
      "</label></p>"
    );
  });
  register("selection", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var options = (api.getSelectionOptions && api.getSelectionOptions(model, fname)) || [];
    var html = '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><select name="' + esc(fname) + '" class="o-field-input"><option value="">—</option>';
    options.forEach(function (opt) {
      html += '<option value="' + esc(opt[0]) + '">' + esc(opt[1]) + "</option>";
    });
    html += "</select></p>";
    return html;
  });
  register("date", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="date" name="' +
      esc(fname) +
      '" class="o-field-input o-field-input--max12"></p>'
    );
  });
  register("datetime", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="datetime-local" name="' +
      esc(fname) +
      '" class="o-field-input o-field-input--max16"></p>'
    );
  });
  register("monetary", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="number" step="0.01" name="' +
      esc(fname) +
      '" class="o-field-input o-field-input--max12"></p>'
    );
  });
  register("html", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div class="html-widget o-field-input o-field-input--textarea" id="html-' +
      esc(fname) +
      '" data-fname="' +
      esc(fname) +
      '" contenteditable="true"></div>' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" id="hidden-html-' +
      esc(fname) +
      '" value=""></p>'
    );
  });
  register("many2one", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var meta = api.getFieldMeta && api.getFieldMeta(model, fname);
    var comodel = (meta && meta.comodel) || (f && f.comodel) || "";
    var wid = "m2o-reg-" + fname + "-" + Math.random().toString(36).slice(2);
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div class="m2one-widget o-m2one-widget" id="' +
      esc(wid) +
      '" data-comodel="' +
      esc(comodel) +
      '" data-fname="' +
      esc(fname) +
      '">' +
      '<input type="text" class="m2one-input o-field-input" placeholder="Search..." autocomplete="off">' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" class="m2one-value">' +
      '<div class="m2one-dropdown o-m2one-dropdown"></div></div></p>'
    );
  });
  register("one2many", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div id="o2m-' +
      esc(fname) +
      '" data-fname="' +
      esc(fname) +
      '" class="o-one2many-placeholder">One2many lines load in full form view.</div></p>'
    );
  });
  register("many2many_tags", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var meta = api.getFieldMeta && api.getFieldMeta(model, fname);
    var comodel = (meta && meta.comodel) || (f && f.comodel) || "";
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div id="m2m-' +
      esc(fname) +
      '" data-widget="many2many_tags" data-comodel="' +
      esc(comodel) +
      '" class="o-field-m2m-host"></div></p>'
    );
  });
  register("binary", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><input type="file" id="file-' +
      esc(fname) +
      '" data-field="' +
      esc(fname) +
      '" class="o-field-file-mt"><input type="hidden" name="' +
      esc(fname) +
      '" id="hidden-' +
      esc(fname) +
      '"><span id="bin-status-' +
      esc(fname) +
      '" class="o-field-bin-status"></span></p>'
    );
  });
  register("image", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return (
      '<p class="attr-field" data-fname="' +
      esc(fname) +
      '"><label>' +
      esc(label) +
      '</label><div id="image-' +
      esc(fname) +
      '" class="image-widget o-field-mt-sm" data-fname="' +
      esc(fname) +
      '">' +
      '<img id="img-preview-' +
      esc(fname) +
      '" src="" alt="" class="o-field-image-preview">' +
      '<input type="file" id="file-' +
      esc(fname) +
      '" data-field="' +
      esc(fname) +
      '" accept="image/*" class="o-field-file-mt">' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" id="hidden-' +
      esc(fname) +
      '"></div></p>'
    );
  });

  /* ── Formatters & Parsers ── */
  var _formatters = {};
  var _parsers = {};

  function registerFormatter(type, fn) {
    if (type && typeof fn === 'function') _formatters[type] = fn;
  }

  function registerParser(type, fn) {
    if (type && typeof fn === 'function') _parsers[type] = fn;
  }

  function format(type, value, options) {
    var fn = _formatters[type];
    return fn ? fn(value, options || {}) : (value == null ? '' : String(value));
  }

  function parse(type, str, options) {
    var fn = _parsers[type];
    return fn ? fn(str, options || {}) : str;
  }

  /**
   * Odoo 19-style getFieldComponent: returns { render, format, parse } triple for a field type.
   */
  function getFieldComponent(type) {
    var renderFn = registry[type] || null;
    return {
      render: renderFn,
      format: _formatters[type] || null,
      parse: _parsers[type] || null,
    };
  }

  /* ── Built-in formatters ── */
  registerFormatter('integer', function (v) {
    if (v == null) return '';
    var n = typeof v === 'number' ? v : parseInt(v, 10);
    return isNaN(n) ? '' : n.toLocaleString();
  });
  registerFormatter('float', function (v, opts) {
    if (v == null) return '';
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (isNaN(n)) return '';
    var digits = (opts && opts.digits != null) ? opts.digits : 2;
    return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  });
  registerFormatter('monetary', function (v, opts) {
    if (v == null) return '';
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (isNaN(n)) return '';
    var currency = (opts && opts.currency) || '';
    var digits = (opts && opts.digits != null) ? opts.digits : 2;
    var formatted = n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return currency ? currency + '\u00A0' + formatted : formatted;
  });
  registerFormatter('date', function (v) {
    if (!v) return '';
    var d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  });
  registerFormatter('datetime', function (v) {
    if (!v) return '';
    var d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  });
  registerFormatter('boolean', function (v) { return v ? 'Yes' : 'No'; });
  registerFormatter('char', function (v) { return v == null ? '' : String(v); });
  registerFormatter('text', function (v) { return v == null ? '' : String(v); });
  registerFormatter('selection', function (v, opts) {
    if (v == null) return '';
    var sel = (opts && opts.selection) || [];
    for (var i = 0; i < sel.length; i++) {
      if (String(sel[i][0]) === String(v)) return sel[i][1];
    }
    return String(v);
  });
  registerFormatter('many2one', function (v) {
    if (!v) return '';
    if (Array.isArray(v)) return v[1] || '';
    return typeof v === 'object' ? (v.display_name || v.name || '') : String(v);
  });
  registerFormatter('float_time', function (v) {
    if (v == null) return '';
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (isNaN(n)) return '';
    var h = Math.floor(n);
    var m = Math.round((n - h) * 60);
    return h + ':' + (m < 10 ? '0' : '') + m;
  });
  registerFormatter('percentage', function (v) {
    if (v == null) return '';
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isNaN(n) ? '' : n.toFixed(1) + '%';
  });

  /* ── Built-in parsers ── */
  registerParser('integer', function (s) {
    if (s == null || s === '') return false;
    var n = parseInt(String(s).replace(/[^0-9\-]/g, ''), 10);
    return isNaN(n) ? false : n;
  });
  registerParser('float', function (s) {
    if (s == null || s === '') return false;
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? false : n;
  });
  registerParser('monetary', function (s) {
    if (s == null || s === '') return false;
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? false : n;
  });
  registerParser('boolean', function (s) {
    if (s === true || s === 'true' || s === '1' || s === 1) return true;
    return false;
  });
  registerParser('date', function (s) {
    if (!s) return false;
    var d = new Date(s);
    if (isNaN(d.getTime())) return false;
    return d.toISOString().slice(0, 10);
  });
  registerParser('datetime', function (s) {
    if (!s) return false;
    var d = new Date(s);
    if (isNaN(d.getTime())) return false;
    return d.toISOString().replace('T', ' ').slice(0, 19);
  });
  registerParser('float_time', function (s) {
    if (!s) return false;
    if (s.indexOf(':') !== -1) {
      var parts = s.split(':');
      var h = parseInt(parts[0], 10) || 0;
      var m = parseInt(parts[1], 10) || 0;
      return h + m / 60;
    }
    var n = parseFloat(s);
    return isNaN(n) ? false : n;
  });

  window.FieldWidgets = {
    register: register,
    render: render,
    registerFormatter: registerFormatter,
    registerParser: registerParser,
    format: format,
    parse: parse,
    getFieldComponent: getFieldComponent,
  };
})();
