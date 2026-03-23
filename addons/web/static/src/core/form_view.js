/**
 * AppCore.FormView with pluggable implementation.
 */
(function () {
  var _impl = {
    renderFieldHtml: null,
    renderFormTreeToHtml: null,
    render: null,
  };

  function setImpl(impl) {
    impl = impl || {};
    _impl.renderFieldHtml = typeof impl.renderFieldHtml === "function" ? impl.renderFieldHtml : _impl.renderFieldHtml;
    _impl.renderFormTreeToHtml = typeof impl.renderFormTreeToHtml === "function" ? impl.renderFormTreeToHtml : _impl.renderFormTreeToHtml;
    _impl.render = typeof impl.render === "function" ? impl.render : _impl.render;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.FormView = {
    setImpl: setImpl,
    renderFieldHtml: function (model, f) {
      if (_impl.renderFieldHtml) return _impl.renderFieldHtml(model, f);
      var x = window.__erpForm; // backward-compatible bridge
      return x && x.renderFieldHtml ? x.renderFieldHtml(model, f) : "";
    },
    renderFormTreeToHtml: function (model, children, opts) {
      if (_impl.renderFormTreeToHtml) return _impl.renderFormTreeToHtml(model, children, opts);
      var x = window.__erpForm; // backward-compatible bridge
      return x && x.renderFormTreeToHtml ? x.renderFormTreeToHtml(model, children, opts) : "";
    },
    render: function (container, opts) {
      if (_impl.render) return !!_impl.render(container, opts);
      var x = window.__erpForm; // backward-compatible bridge
      if (x && typeof x.renderFormDelegated === "function") {
        return !!x.renderFormDelegated(container, opts);
      }
      return false;
    },
  };
})();
