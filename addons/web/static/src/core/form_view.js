/**
 * AppCore.FormView (Phase 391)
 * Non-breaking delegation scaffold: returns false to keep legacy renderer active.
 */
(function () {
  function render(_container, _opts) {
    return false;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.FormView = { render: render };
})();
