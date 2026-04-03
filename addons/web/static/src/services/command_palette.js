/**
 * Command palette — fuzzy filter + menu-derived commands (Phase 416).
 * 1.250.14: arrow-key navigation, action callback support, extended hotkey matrix.
 */
(function () {
  var mounted = false;
  var allCommands = [];
  var palettePreviousFocus = null;
  var globalEscapeBound = false;
  var activeIndex = -1;

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

  /** Highlight the item at given index; -1 clears all highlights. */
  function highlightItem(listEl, idx) {
    var items = listEl.querySelectorAll(".o-command-item");
    items.forEach(function (n, i) {
      if (i === idx) {
        n.setAttribute("aria-selected", "true");
        n.style.background = "var(--color-surface-2)";
        n.scrollIntoView({ block: "nearest" });
      } else {
        n.removeAttribute("aria-selected");
        n.style.background = "";
      }
    });
  }

  /** Execute a command (href navigation or action callback). */
  function executeCommand(cmd) {
    if (typeof cmd.action === "function") {
      cmd.action();
    } else if (cmd.href) {
      window.location.hash = cmd.href.replace(/^#/, "");
    }
    close();
  }

  var currentRanked = [];

  function renderResults(input, wrap) {
    var q = (input.value || "").trim();
    var listEl = wrap.querySelector("#o-command-results");
    if (!listEl) return;
    currentRanked = allCommands
      .map(function (c) {
        return { c: c, s: Math.max(score(q, c.title), score(q, c.keys || "")) };
      })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12);
    listEl.innerHTML = "";
    activeIndex = currentRanked.length > 0 ? 0 : -1;
    currentRanked.forEach(function (x, idx) {
      var li = document.createElement("button");
      li.type = "button";
      li.className = "o-command-item";
      li.setAttribute("role", "option");
      li.style.cssText =
        "display:block;width:100%;text-align:left;padding:var(--space-sm) var(--space-md);border:none;background:transparent;cursor:pointer;font:inherit;color:inherit;border-radius:var(--radius-sm)";
      li.textContent = x.c.title;
      if (x.c.href) li.dataset.href = x.c.href;
      li.onmouseenter = function () {
        activeIndex = idx;
        highlightItem(listEl, activeIndex);
      };
      li.onclick = function () { executeCommand(x.c); };
      listEl.appendChild(li);
    });
    if (!currentRanked.length) {
      listEl.innerHTML = '<div style="padding:var(--space-md);color:var(--text-muted)">No matches</div>';
      activeIndex = -1;
    } else {
      highlightItem(listEl, activeIndex);
    }
  }

  function ensure() {
    if (mounted) return;
    mounted = true;
    var wrap = document.createElement("div");
    wrap.id = "o-command-palette";
    wrap.className = "o-command-palette";
    wrap.hidden = true;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Command palette");
    wrap.innerHTML =
      '<div class="o-command-palette-panel" style="background:var(--color-surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-md);max-width:28rem;width:100%;margin:auto">' +
      '<input id="o-command-input" type="search" placeholder="Search commands and menus…" style="width:100%;padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
      '<div id="o-command-results" style="margin-top:var(--space-sm);max-height:16rem;overflow-y:auto"></div>' +
      "<small style=\"display:block;margin-top:var(--space-sm);color:var(--text-muted)\">Enter to use first result · Esc to close</small></div>";
    document.body.appendChild(wrap);
    if (!globalEscapeBound) {
      globalEscapeBound = true;
      document.addEventListener(
        "keydown",
        function (e) {
          var el = document.getElementById("o-command-palette");
          if (!el || el.hidden || e.key !== "Escape") return;
          e.preventDefault();
          close();
        },
        true
      );
    }
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) close();
    });
    var input = wrap.querySelector("#o-command-input");
    if (input) {
      input.setAttribute("aria-label", "Search commands and menus");
      input.addEventListener("input", function () {
        renderResults(input, wrap);
      });
      input.addEventListener("keydown", function (e) {
        var listEl = wrap.querySelector("#o-command-results");
        if (e.key === "Escape") {
          return close();
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (currentRanked.length) {
            activeIndex = Math.min(activeIndex + 1, currentRanked.length - 1);
            highlightItem(listEl, activeIndex);
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (currentRanked.length) {
            activeIndex = Math.max(activeIndex - 1, 0);
            highlightItem(listEl, activeIndex);
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0 && currentRanked[activeIndex]) {
            executeCommand(currentRanked[activeIndex].c);
          }
        }
      });
    }
  }

  function open() {
    palettePreviousFocus = document.activeElement;
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
    if (palettePreviousFocus && typeof palettePreviousFocus.focus === "function") {
      try {
        palettePreviousFocus.focus();
      } catch (e) {}
    }
    palettePreviousFocus = null;
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
    /**
     * Register a navigation command (resolves to a hash route).
     * @param {string} href - Hash route e.g. "#contacts"
     * @param {string} title - Display label
     * @param {string} [keys] - Additional search keywords
     */
    registerCommand: function (href, title, keys) {
      allCommands.push({ href: href, title: title, keys: keys || title });
    },
    /**
     * Register a command with an action callback instead of (or in addition to) an href.
     * @param {string} title - Display label
     * @param {Function} action - Called when the command is activated
     * @param {string} [keys] - Additional search keywords
     * @param {string} [href] - Optional fallback hash
     */
    registerActionCommand: function (title, action, keys, href) {
      allCommands.push({ title: title, action: action, keys: keys || title, href: href || null });
    },
    /** Remove all registered commands (useful for re-seeding on menu load). */
    clearCommands: function () {
      allCommands = [];
    },
  };
})();
