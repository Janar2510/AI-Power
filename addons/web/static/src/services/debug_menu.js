/**
 * Debug menu service (Phase 400).
 */
(function () {
  var KEY = "erp_debug_mode";
  function isEnabled() {
    try { return localStorage.getItem(KEY) === "1"; } catch (_e) { return false; }
  }
  function setEnabled(v) {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (_e) { /* noop */ }
  }
  function toggle() { setEnabled(!isEnabled()); window.location.reload(); }
  function mount(navbar) {
    if (!navbar || navbar.querySelector(".o-debug-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "o-debug-toggle";
    btn.textContent = isEnabled() ? "Debug: ON" : "Debug";
    btn.style.marginLeft = "0.5rem";
    btn.onclick = toggle;
    navbar.appendChild(btn);
  }
  window.Services = window.Services || {};
  window.Services.debugMenu = { isEnabled: isEnabled, toggle: toggle, mount: mount };
})();
