/**
 * Hotkey service (Phase 398).
 */
(function () {
  var handlers = {};
  var scopes = {};
  var activeScope = "global";
  var bound = false;

  function normalize(evt) {
    var parts = [];
    if (evt.ctrlKey || evt.metaKey) parts.push("mod");
    if (evt.altKey) parts.push("alt");
    if (evt.shiftKey) parts.push("shift");
    parts.push(String(evt.key || "").toLowerCase());
    return parts.join("+");
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    document.addEventListener("keydown", function (evt) {
      var key = normalize(evt);
      var scoped = scopes[activeScope] || {};
      var fn = scoped[key] || handlers[key];
      if (typeof fn === "function") {
        /* Align with command palette + browser defaults: avoid Mod+K being stolen by Chrome. */
        if (key === "mod+k" || key === "mod+shift+k") evt.preventDefault();
        fn(evt);
      }
    });
  }

  function register(key, fn) {
    bindOnce();
    handlers[String(key || "").toLowerCase()] = fn;
  }

  function registerScoped(scope, key, fn) {
    bindOnce();
    var s = String(scope || "").trim();
    if (!s) return;
    scopes[s] = scopes[s] || {};
    scopes[s][String(key || "").toLowerCase()] = fn;
  }

  function setScope(scope) {
    activeScope = String(scope || "global");
  }

  function unregister(key) {
    delete handlers[String(key || "").toLowerCase()];
  }

  window.Services = window.Services || {};
  window.Services.hotkey = {
    register: register,
    registerScoped: registerScoped,
    setScope: setScope,
    unregister: unregister,
  };
})();
