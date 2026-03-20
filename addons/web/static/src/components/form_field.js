/**
 * Form field registry (Phase 391/396).
 */
(function () {
  var registry = {};

  function register(type, renderer) {
    if (!type || typeof renderer !== "function") return;
    registry[type] = renderer;
  }

  function render(field, value, opts) {
    var t = (field && field.type) || "char";
    var r = registry[t] || registry.char;
    return r ? r(field || {}, value, opts || {}) : "";
  }

  register("char", function (f, value) {
    return '<input type="text" class="o-form-input" name="' + (f.name || "") + '" value="' + String(value || "").replace(/"/g, "&quot;") + '">';
  });
  register("text", function (f, value) {
    return '<textarea class="o-form-input" name="' + (f.name || "") + '">' + String(value || "").replace(/</g, "&lt;") + "</textarea>";
  });
  register("boolean", function (f, value) {
    return '<label class="o-form-check"><input type="checkbox" name="' + (f.name || "") + '"' + (value ? " checked" : "") + "> <span>" + ((f.string || f.name || "").replace(/</g, "&lt;")) + "</span></label>";
  });
  register("priority", function (_f, value) { return '<span class="o-field-priority">' + String(value || 0) + "</span>"; });
  register("progress_bar", function (_f, value) { return '<progress class="o-field-progress" max="100" value="' + Number(value || 0) + '"></progress>'; });
  register("selection_badge", function (_f, value) { return '<span class="o-field-badge">' + String(value || "").replace(/</g, "&lt;") + "</span>"; });
  register("state_selection", function (_f, value) { return '<span class="o-field-state">' + String(value || "").replace(/</g, "&lt;") + "</span>"; });
  register("handle", function () { return '<span class="o-field-handle" aria-hidden="true">::</span>'; });
  register("signature", function () { return '<canvas class="o-field-signature" height="64"></canvas>'; });
  register("remaining_days", function (_f, value) { return '<span class="o-field-remaining-days">' + String(value || "") + "</span>"; });
  register("color_picker", function (f, value) { return '<input type="color" class="o-form-input" name="' + (f.name || "") + '" value="' + String(value || "#000000").replace(/"/g, "&quot;") + '">'; });
  register("badge", function (_f, value) { return '<span class="o-field-badge">' + String(value || "").replace(/</g, "&lt;") + "</span>"; });

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.FormField = {
    register: register,
    render: render,
  };
})();
