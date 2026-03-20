/**
 * Hotkey service (Phase 398).
 */
(function () {
  var handlers = {};
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
      var fn = handlers[key];
      if (typeof fn === "function") {
        fn(evt);
      }
    });
  }

  function register(key, fn) {
    bindOnce();
    handlers[String(key || "").toLowerCase()] = fn;
  }

  window.Services = window.Services || {};
  window.Services.hotkey = {
    register: register,
  };
})();
