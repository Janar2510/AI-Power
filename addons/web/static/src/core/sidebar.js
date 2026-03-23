/**
 * AppCore.Sidebar with pluggable renderer + wiring.
 */
(function () {
  var _renderImpl = null;
  var _wireImpl = null;

  function setImpl(impl) {
    impl = impl || {};
    _renderImpl = typeof impl.render === "function" ? impl.render : _renderImpl;
    _wireImpl = typeof impl.wire === "function" ? impl.wire : _wireImpl;
  }

  function render(opts) {
    if (!_renderImpl) return "";
    return _renderImpl(opts || {}) || "";
  }

  function wire(opts) {
    if (!_wireImpl) return false;
    return !!_wireImpl(opts || {});
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.Sidebar = { setImpl: setImpl, render: render, wire: wire };
})();
