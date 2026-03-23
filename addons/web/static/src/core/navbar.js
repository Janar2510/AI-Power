/**
 * AppCore.Navbar with pluggable renderer.
 */
(function () {
  var _impl = null;

  function setImpl(fn) {
    _impl = typeof fn === "function" ? fn : null;
  }

  function render(opts) {
    if (_impl) return !!_impl(opts || {});
    var navbar = opts && opts.navbar;
    if (navbar && window.Services && window.Services.debugMenu && typeof window.Services.debugMenu.mount === "function") {
      window.Services.debugMenu.mount(navbar);
    }
    return false;
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.Navbar = { setImpl: setImpl, render: render };
})();
