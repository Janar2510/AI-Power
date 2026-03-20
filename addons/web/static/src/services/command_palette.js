/**
 * Command palette service (Phase 398).
 */
(function () {
  var mounted = false;

  function ensure() {
    if (mounted) return;
    mounted = true;
    var wrap = document.createElement("div");
    wrap.id = "o-command-palette";
    wrap.className = "o-command-palette";
    wrap.hidden = true;
    wrap.innerHTML = '<div class="o-command-palette-panel"><input id="o-command-input" type="text" placeholder="Type a route and press Enter"><small>Examples: home, contacts, leads</small></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    var input = wrap.querySelector("#o-command-input");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") return close();
      if (e.key === "Enter") {
        var v = (input.value || "").trim().replace(/^#/, "");
        if (v) window.location.hash = v;
        close();
      }
    });
  }

  function open() {
    ensure();
    var el = document.getElementById("o-command-palette");
    if (!el) return;
    el.hidden = false;
    var input = document.getElementById("o-command-input");
    if (input) input.focus();
  }

  function close() {
    var el = document.getElementById("o-command-palette");
    if (!el) return;
    el.hidden = true;
  }

  function initHotkey() {
    if (window.Services && window.Services.hotkey) {
      window.Services.hotkey.register("mod+k", function (evt) {
        evt.preventDefault();
        open();
      });
    }
  }

  window.Services = window.Services || {};
  window.Services.commandPalette = { open: open, close: close, initHotkey: initHotkey };
})();
