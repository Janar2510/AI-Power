/**
 * Select/Create dialog (Phase 397).
 */
(function () {
  function open(opts) {
    opts = opts || {};
    var promptLabel = opts.prompt || "Enter name";
    var value = window.prompt(promptLabel, "");
    if (!value) return Promise.resolve(null);
    return Promise.resolve({ id: null, name: value });
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.SelectCreateDialog = { open: open };
})();
