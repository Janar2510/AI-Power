/**
 * Command palette — fuzzy filter + menu-derived commands (Phase 416).
 */
(function () {
  var mounted = false;
  var allCommands = [];

  function slug(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function score(q, text) {
    if (!q) return 1;
    var t = slug(text);
    var qq = slug(q);
    if (!qq) return 1;
    if (t.indexOf(qq) >= 0) return 2;
    var words = qq.split(" ");
    var hit = 0;
    words.forEach(function (w) {
      if (w && t.indexOf(w) >= 0) hit++;
    });
    return hit / Math.max(words.length, 1);
  }

  function buildCommandsFromMenus() {
    allCommands = [
      { href: "#home", title: "Home", keys: "home apps" },
      { href: "#contacts", title: "Contacts", keys: "contacts partners" },
      { href: "#leads", title: "Leads", keys: "leads crm pipeline" },
      { href: "#discuss", title: "Discuss", keys: "discuss chat mail" },
      { href: "#settings", title: "Settings", keys: "settings config" },
    ];
    try {
      var viewsSvc = window.Services && window.Services.views;
      var menus = viewsSvc && viewsSvc.getMenus ? viewsSvc.getMenus() : [];
      (menus || []).forEach(function (m) {
        if (!m || !m.name) return;
        var action = m.action && viewsSvc.getAction ? viewsSvc.getAction(m.action) : null;
        var route = "";
        if (action && action.res_model) {
          route = "#" + String(action.res_model).replace(/\./g, "_");
        }
        if (route) {
          allCommands.push({
            href: route,
            title: m.name,
            keys: slug(m.name),
          });
        }
      });
    } catch (e) {}
  }

  function renderResults(input, wrap) {
    var q = (input.value || "").trim();
    var listEl = wrap.querySelector("#o-command-results");
    if (!listEl) return;
    var ranked = allCommands
      .map(function (c) {
        return { c: c, s: Math.max(score(q, c.title), score(q, c.keys)) };
      })
      .filter(function (x) {
        return x.s > 0;
      })
      .sort(function (a, b) {
        return b.s - a.s;
      })
      .slice(0, 12);
    listEl.innerHTML = "";
    ranked.forEach(function (x, idx) {
      var li = document.createElement("button");
      li.type = "button";
      li.className = "o-command-item";
      li.style.cssText =
        "display:block;width:100%;text-align:left;padding:var(--space-sm) var(--space-md);border:none;background:transparent;cursor:pointer;font:inherit;color:inherit;border-radius:var(--radius-sm)";
      li.textContent = x.c.title;
      li.dataset.href = x.c.href;
      li.onmouseenter = function () {
        listEl.querySelectorAll(".o-command-item").forEach(function (n) {
          n.style.background = "";
        });
        li.style.background = "var(--color-surface-2)";
      };
      li.onclick = function () {
        if (x.c.href) window.location.hash = x.c.href.replace(/^#/, "");
        close();
      };
      listEl.appendChild(li);
    });
    if (!ranked.length) {
      listEl.innerHTML = '<div style="padding:var(--space-md);color:var(--text-muted)">No matches</div>';
    }
  }

  function ensure() {
    if (mounted) return;
    mounted = true;
    var wrap = document.createElement("div");
    wrap.id = "o-command-palette";
    wrap.className = "o-command-palette";
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="o-command-palette-panel" style="background:var(--color-surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-md);max-width:28rem;width:100%;margin:auto">' +
      '<input id="o-command-input" type="search" placeholder="Search commands and menus…" style="width:100%;padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
      '<div id="o-command-results" style="margin-top:var(--space-sm);max-height:16rem;overflow-y:auto"></div>' +
      "<small style=\"display:block;margin-top:var(--space-sm);color:var(--text-muted)\">Enter to use first result · Esc to close</small></div>";
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) close();
    });
    var input = wrap.querySelector("#o-command-input");
    input.addEventListener("input", function () {
      renderResults(input, wrap);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") return close();
      if (e.key === "Enter") {
        var first = wrap.querySelector(".o-command-item");
        if (first && first.dataset.href) {
          window.location.hash = first.dataset.href.replace(/^#/, "");
          close();
        }
      }
    });
  }

  function open() {
    ensure();
    buildCommandsFromMenus();
    var el = document.getElementById("o-command-palette");
    if (!el) return;
    el.hidden = false;
    var input = document.getElementById("o-command-input");
    if (input) {
      input.value = "";
      input.focus();
      renderResults(input, el);
    }
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
  window.Services.commandPalette = {
    open: open,
    close: close,
    initHotkey: initHotkey,
    registerCommand: function (href, title, keys) {
      allCommands.push({ href: href, title: title, keys: keys || title });
    },
  };
})();
