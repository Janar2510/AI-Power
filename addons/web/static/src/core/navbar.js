/**
 * AppCore.Navbar (Phase 392) — debug menu mount; full navbar stays in main.js.
 */
(function () {
  function render(opts) {
    var navbar = opts && opts.navbar;
    if (navbar && window.Services && window.Services.debugMenu && typeof window.Services.debugMenu.mount === "function") {
      window.Services.debugMenu.mount(navbar);
    }
    return false;
  }
  window.AppCore = window.AppCore || {};
  window.AppCore.Navbar = { render: render };
})();
