/**
 * Confirm dialog component (Phase 397).
 */
(function () {
  function confirm(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var title = opts.title || "Confirm";
      var message = opts.message || "Are you sure?";
      var ok = window.confirm(title + "\n\n" + message);
      resolve(!!ok);
    });
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.ConfirmDialog = { confirm: confirm };
})();
