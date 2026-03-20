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

  window.FieldWidgets = { register: register, render: render };
})();
