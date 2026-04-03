/**
 * Debug menu service (Phase 400 / 1.250.16 enhancement).
 *
 * Provides a debug toggle button in the navbar with a dropdown panel
 * containing developer submenus:
 *   - View metadata (model, view type, action id from current route)
 *   - Toggle assets debug (?debug=assets)
 *   - Run JS tests (opens test_runner.html)
 *   - Technical info (version, session uid, database)
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

  // ── version / session helpers ─────────────────────────────────────────────
  function _getVersion() {
    var bs = window.__erpFrontendBootstrap || {};
    return bs.serverVersion || bs.version || "—";
  }

  function _getSessionInfo() {
    var sess = window.__erpSession || {};
    return {
      uid: sess.uid || "—",
      db: sess.db || sess.database || "—",
      company: sess.company_name || "—",
    };
  }

  function _getCurrentViewMeta() {
    var hash = (window.location.hash || "").slice(1);
    var base = hash.split("?")[0];
    var parts = base.split("/");
    var route = parts[0] || "—";
    var action = parts[1] === "edit" || parts[1] === "new" ? parts[1] : (parts.length > 1 ? parts[1] : "list");
    var model = "—";
    try {
      if (window.__ERP_getModelForRoute) model = window.__ERP_getModelForRoute(route) || "—";
    } catch (_e) { /* noop */ }
    return { route: route, viewType: action, model: model };
  }

  // ── dropdown panel ────────────────────────────────────────────────────────
  function _closePanel() {
    var existing = document.getElementById("o-debug-panel");
    if (existing) existing.remove();
  }

  function _openPanel(anchorBtn) {
    _closePanel();
    var panel = document.createElement("div");
    panel.id = "o-debug-panel";
    panel.setAttribute("role", "menu");
    panel.style.cssText = [
      "position:fixed",
      "z-index:var(--z-debug-menu,9999)",
      "background:var(--color-surface,#fff)",
      "border:1px solid var(--color-border,#ddd)",
      "border-radius:var(--radius-md,6px)",
      "box-shadow:var(--shadow-lg,0 4px 16px rgba(0,0,0,.15))",
      "padding:var(--space-2,8px) 0",
      "min-width:220px",
      "font-size:var(--font-size-sm,13px)",
      "color:var(--color-text,#333)",
    ].join(";");

    var rect = anchorBtn.getBoundingClientRect();
    panel.style.top = (rect.bottom + 4) + "px";
    panel.style.right = (window.innerWidth - rect.right) + "px";

    var version = _getVersion();
    var sess = _getSessionInfo();
    var meta = _getCurrentViewMeta();

    var items = [
      {
        label: "Version: " + version,
        icon: "🔖",
        action: null,
        disabled: true,
      },
      { separator: true },
      {
        label: "View metadata",
        icon: "🔍",
        action: function () {
          var msg = [
            "Route:     " + meta.route,
            "View type: " + meta.viewType,
            "Model:     " + meta.model,
          ].join("\n");
          alert(msg);
        },
      },
      {
        label: "Technical info",
        icon: "ℹ️",
        action: function () {
          var msg = [
            "Version:  " + version,
            "UID:      " + sess.uid,
            "Database: " + sess.db,
            "Company:  " + sess.company,
          ].join("\n");
          alert(msg);
        },
      },
      {
        label: "Toggle assets debug",
        icon: "⚙️",
        action: function () {
          var url = window.location.href;
          if (url.indexOf("debug=assets") >= 0) {
            window.location.href = url.replace(/[?&]debug=assets/, "");
          } else {
            var sep = url.indexOf("?") >= 0 ? "&" : "?";
            window.location.href = url + sep + "debug=assets";
          }
        },
      },
      {
        label: "Run JS tests",
        icon: "🧪",
        action: function () {
          window.open("/web/static/tests/test_runner.html", "_blank");
        },
      },
      { separator: true },
      {
        label: isEnabled() ? "Disable debug mode" : "Enable debug mode",
        icon: "🐛",
        action: toggle,
      },
    ];

    items.forEach(function (item) {
      if (item.separator) {
        var hr = document.createElement("hr");
        hr.style.cssText = "margin:var(--space-1,4px) 0;border:none;border-top:1px solid var(--color-border,#eee)";
        panel.appendChild(hr);
        return;
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "menuitem");
      btn.style.cssText = [
        "display:block",
        "width:100%",
        "text-align:left",
        "padding:var(--space-2,8px) var(--space-4,16px)",
        "border:none",
        "background:none",
        "cursor:" + (item.disabled ? "default" : "pointer"),
        "opacity:" + (item.disabled ? "0.6" : "1"),
        "font-size:inherit",
        "color:inherit",
        "white-space:nowrap",
      ].join(";");
      btn.innerHTML = '<span style="margin-right:6px">' + (item.icon || "") + "</span>" +
        String(item.label || "").replace(/</g, "&lt;");
      if (!item.disabled && typeof item.action === "function") {
        btn.onmouseover = function () { btn.style.background = "var(--color-surface-hover,#f5f5f5)"; };
        btn.onmouseout = function () { btn.style.background = ""; };
        btn.onclick = function () {
          _closePanel();
          item.action();
        };
      }
      panel.appendChild(btn);
    });

    document.body.appendChild(panel);

    function _handleOutside(e) {
      if (!panel.contains(e.target) && e.target !== anchorBtn) {
        _closePanel();
        document.removeEventListener("mousedown", _handleOutside);
      }
    }
    setTimeout(function () { document.addEventListener("mousedown", _handleOutside); }, 0);
  }

  // ── navbar mount ──────────────────────────────────────────────────────────
  function mount(navbar) {
    if (!navbar || navbar.querySelector(".o-debug-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "o-debug-toggle";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("title", "Debug tools");
    btn.textContent = isEnabled() ? "Debug ▾" : "Debug";
    btn.style.cssText = [
      "margin-left:0.5rem",
      "background:var(--color-debug-btn,transparent)",
      "border:1px solid var(--color-border,#ccc)",
      "border-radius:var(--radius-sm,4px)",
      "padding:2px 8px",
      "font-size:var(--font-size-sm,12px)",
      "cursor:pointer",
      "color:var(--color-warning,#b07800)",
    ].join(";");
    btn.onclick = function (e) {
      e.stopPropagation();
      if (document.getElementById("o-debug-panel")) {
        _closePanel();
      } else {
        _openPanel(btn);
      }
    };
    navbar.appendChild(btn);
  }

  window.Services = window.Services || {};
  window.Services.debugMenu = {
    isEnabled: isEnabled,
    toggle: toggle,
    mount: mount,
    openPanel: _openPanel,
    closePanel: _closePanel,
  };
})();
