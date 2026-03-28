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
      '" value="#4a9eff" style="width:3rem;height:2.25rem;margin-top:var(--space-sm);padding:0;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></p>'
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
      '" class="o-field-badge-input" placeholder="Badge text" style="width:100%;max-width:16rem;margin-top:var(--space-sm);padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-md);background:var(--color-surface-2);border:1px solid var(--border-color);font-size:0.85rem"></p>'
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
      'style="width:100%;max-width:12rem;padding:var(--space-sm);margin-top:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></p>'
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
      '</label><div class="progressbar-widget" style="margin-top:var(--space-sm);display:flex;align-items:center;gap:var(--space-sm)">' +
      '<div style="flex:1;height:8px;background:var(--color-surface-2);border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-color)">' +
      '<div class="progressbar-fill" style="height:100%;background:var(--color-primary);width:0%;transition:width var(--duration-base)"></div></div>' +
      '<input type="number" name="' +
      esc(fname) +
      '" min="0" max="100" step="0.1" style="width:4rem;padding:var(--space-xs);border:1px solid var(--border-color);border-radius:var(--radius-sm)"></div></p>'
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
      '</label><div class="o-signature-widget" style="margin-top:var(--space-sm)">' +
      '<canvas class="o-signature-canvas" data-fname="' +
      esc(fname) +
      '" width="400" height="120" style="max-width:100%;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1);touch-action:none;cursor:crosshair"></canvas>' +
      '<div style="margin-top:var(--space-xs)"><button type="button" class="o-signature-clear o-btn o-btn-secondary" data-fname="' +
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
      '" rows="4" placeholder="[[&quot;field&quot;, &quot;=&quot;, value]]" style="width:100%;margin-top:var(--space-sm);padding:var(--space-sm);font-family:monospace;font-size:0.85rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></textarea></p>'
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
    return '<p class="attr-field" data-fname="' + esc(f.name) + '"><label>' + esc(f.string || f.name || "Handle") + '</label><span style="display:inline-block;margin-top:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:1px dashed var(--border-color);border-radius:var(--radius-sm);cursor:grab">::</span></p>';
  });

  register("email", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="email" name="' + esc(fname) + '" style="width:100%;margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm)"></p>';
  });

  register("url", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="url" name="' + esc(fname) + '" placeholder="https://..." style="width:100%;margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm)"></p>';
  });

  register("phone", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="tel" name="' + esc(fname) + '" style="width:100%;margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm)"></p>';
  });

  register("copy_clipboard", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><div style="display:flex;gap:var(--card-gap);margin-top:var(--space-sm)"><input type="text" name="' + esc(fname) + '" style="flex:1;padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><button type="button" class="o-btn o-btn-secondary" data-copy-field="' + esc(fname) + '">Copy</button></div></p>';
  });

  register("float_time", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><input type="number" step="0.25" name="' + esc(fname) + '" placeholder="1.50" style="width:8rem;margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><small style="display:block;color:var(--text-muted);margin-top:var(--space-xs)">Hours in decimal format</small></p>';
  });

  register("radio", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var options = (api.getSelectionOptions && api.getSelectionOptions(model, fname)) || [];
    var html = '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><span style="display:flex;gap:var(--card-gap);margin-top:var(--space-sm);flex-wrap:wrap">';
    options.forEach(function (opt, i) {
      html += '<label><input type="radio" name="' + esc(fname) + '" value="' + esc(opt[0]) + '"' + (i === 0 ? " checked" : "") + "> " + esc(opt[1]) + "</label>";
    });
    html += "</span></p>";
    return html;
  });

  register("many2many_checkboxes", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    return '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><div class="o-m2m-checkboxes" style="margin-top:var(--space-sm);display:grid;gap:var(--space-xs)"><label><input type="checkbox" name="' + esc(fname) + '" value="1"> Option 1</label><label><input type="checkbox" name="' + esc(fname) + '" value="2"> Option 2</label><label><input type="checkbox" name="' + esc(fname) + '" value="3"> Option 3</label></div></p>';
  });

  /** Phase 774: core field-type widgets (Odoo-style names) for registry-driven forms. */
  function baseInputStyle(extra) {
    return (
      "margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1);color:var(--color-text)" +
      (extra ? ";" + extra : ";width:100%")
    );
  }
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
      'style="' +
      baseInputStyle("") +
      '"></p>'
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
      '" rows="4" style="' +
      baseInputStyle("resize:vertical") +
      '"></textarea></p>'
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
      '" style="max-width:12rem;' +
      baseInputStyle("width:auto") +
      '"></p>'
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
      '" style="max-width:12rem;' +
      baseInputStyle("width:auto") +
      '"></p>'
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
      '" value="1" style="margin-right:var(--space-xs)">' +
      esc(label) +
      "</label></p>"
    );
  });
  register("selection", function (model, f, api) {
    var fname = f.name;
    var label = (api.getFieldLabel && api.getFieldLabel(model, fname)) || fname;
    var options = (api.getSelectionOptions && api.getSelectionOptions(model, fname)) || [];
    var html = '<p class="attr-field" data-fname="' + esc(fname) + '"><label>' + esc(label) + '</label><select name="' + esc(fname) + '" style="' + baseInputStyle("") + '"><option value="">—</option>';
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
      '" style="max-width:12rem;' +
      baseInputStyle("width:auto") +
      '"></p>'
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
      '" style="max-width:16rem;' +
      baseInputStyle("width:auto") +
      '"></p>'
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
      '" style="max-width:12rem;' +
      baseInputStyle("width:auto") +
      '"></p>'
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
      '</label><div class="html-widget" id="html-' +
      esc(fname) +
      '" data-fname="' +
      esc(fname) +
      '" contenteditable="true" style="min-height:6rem;margin-top:var(--space-sm);padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></div>' +
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
      '</label><div class="m2one-widget" id="' +
      esc(wid) +
      '" data-comodel="' +
      esc(comodel) +
      '" data-fname="' +
      esc(fname) +
      '" style="margin-top:var(--space-sm);position:relative">' +
      '<input type="text" class="m2one-input" placeholder="Search..." autocomplete="off" style="' +
      baseInputStyle("") +
      '">' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" class="m2one-value">' +
      '<div class="m2one-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--color-surface-1);border:1px solid var(--border-color);border-radius:var(--radius-sm);max-height:200px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.08)"></div></div></p>'
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
      '" class="o-one2many-placeholder" style="margin-top:var(--space-sm);padding:var(--space-md);border:1px dashed var(--border-color);border-radius:var(--radius-sm);color:var(--text-muted)">One2many lines load in full form view.</div></p>'
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
      '" style="margin-top:var(--space-sm);min-height:2rem"></div></p>'
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
      '" style="margin-top:var(--space-sm)"><input type="hidden" name="' +
      esc(fname) +
      '" id="hidden-' +
      esc(fname) +
      '"><span id="bin-status-' +
      esc(fname) +
      '" style="font-size:0.85rem;color:var(--text-muted);margin-left:var(--space-xs)"></span></p>'
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
      '" class="image-widget" data-fname="' +
      esc(fname) +
      '" style="margin-top:var(--space-sm)">' +
      '<img id="img-preview-' +
      esc(fname) +
      '" src="" alt="" style="max-width:200px;max-height:150px;display:none;border-radius:var(--radius-sm);border:1px solid var(--border-color)">' +
      '<input type="file" id="file-' +
      esc(fname) +
      '" data-field="' +
      esc(fname) +
      '" accept="image/*" style="margin-top:var(--space-sm)">' +
      '<input type="hidden" name="' +
      esc(fname) +
      '" id="hidden-' +
      esc(fname) +
      '"></div></p>'
    );
  });

  window.FieldWidgets = { register: register, render: render };
})();
