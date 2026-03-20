/**
 * AppCore.FormView — delegated field/tree renderers (Phase 411).
 * Runtime implementations live in main.js (window.__erpForm).
 */
(function () {
  window.AppCore = window.AppCore || {};
  window.AppCore.FormView = {
    renderFieldHtml: function (model, f) {
      var x = window.__erpForm;
      return x && x.renderFieldHtml ? x.renderFieldHtml(model, f) : "";
    },
    renderFormTreeToHtml: function (model, children, opts) {
      var x = window.__erpForm;
      return x && x.renderFormTreeToHtml ? x.renderFormTreeToHtml(model, children, opts) : "";
    },
    render: function (container, opts) {
      var x = window.__erpForm;
      if (x && typeof x.renderFormDelegated === "function") {
        return x.renderFormDelegated(container, opts);
      }
      return false;
    },
  };
})();
