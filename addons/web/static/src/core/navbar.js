/**
 * AppCore.Navbar with default shell renderer.
 */
(function () {
  var _impl = null;

  function setImpl(fn) {
    _impl = typeof fn === "function" ? fn : null;
  }

  function escHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escAttr(value) {
    return escHtml(value).replace(/"/g, "&quot;");
  }

  function getPreferredTheme(explicitTheme) {
    if (explicitTheme) return explicitTheme;
    var savedTheme = typeof localStorage !== "undefined" ? localStorage.getItem("erp_theme") : "";
    var prefersDark = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return savedTheme || (prefersDark ? "dark" : "light");
  }

  function renderMenuItem(item) {
    item = item || {};
    var href = item.href || "#";
    var cls = "nav-link o-navbar-link o-navbar-menu-link" + (item.disabled ? " nav-link-disabled" : "");
    if (!item.children || !item.children.length) {
      return '<a href="' + escAttr(href) + '" class="' + cls + '" data-menu-id="' + escAttr(item.id || "") + '">' + escHtml(item.name || "") + "</a>";
    }
    return (
      '<span class="nav-dropdown o-navbar-dropdown o-navbar-menu-group" data-dropdown-mode="menu">' +
        '<a href="' + escAttr(href) + '" class="' + cls + '" data-menu-id="' + escAttr(item.id || "") + '" aria-haspopup="true" aria-expanded="false">' +
          escHtml(item.name || "") +
          '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span>' +
        "</a>" +
        '<span class="nav-dropdown-content o-navbar-dropdown-panel" hidden>' +
          item.children.map(function (child) {
            return '<a href="' + escAttr(child.href || "#") + '" class="nav-link o-navbar-link o-navbar-dropdown-link" data-menu-id="' + escAttr(child.id || "") + '">' + escHtml(child.name || "") + "</a>";
          }).join("") +
        "</span>" +
      "</span>"
    );
  }

  function renderNotificationItems(list) {
    var modelToRoute = {
      "res.partner": "contacts",
      "crm.lead": "leads",
      "sale.order": "orders",
      "mail.channel": "discuss",
    };
    if (!list || !list.length) {
      return '<p class="o-navbar-empty">No new notifications</p>';
    }
    return list.map(function (item) {
      var route = modelToRoute[item.res_model] || (item.res_model ? String(item.res_model).replace(/\./g, "_") : "");
      var href = route === "discuss" && item.res_id ? "#discuss/" + item.res_id : (route ? "#" + route + "/edit/" + (item.res_id || "") : "#");
      return (
        '<a href="' + escAttr(href) + '" class="notification-item o-navbar-notification-item" data-id="' + escAttr(item.id || "") + '">' +
          '<span class="o-navbar-notification-body">' + escHtml((item.body || "").substring(0, 80)) + "</span>" +
          '<span class="o-navbar-notification-meta">' + escHtml((item.date || "").substring(0, 16)) + "</span>" +
        "</a>"
      );
    }).join("");
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove("nav-dropdown-open");
    dropdown.classList.remove("is-open");
    var trigger = dropdown.querySelector("[data-navbar-dropdown-trigger]");
    var panel = dropdown.querySelector(".nav-dropdown-content");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  }

  function closeAllDropdowns(navbar, except) {
    if (!navbar) return;
    navbar.querySelectorAll(".nav-dropdown").forEach(function (dropdown) {
      if (dropdown !== except) closeDropdown(dropdown);
    });
  }

  function openDropdown(navbar, dropdown) {
    if (!dropdown) return;
    closeAllDropdowns(navbar, dropdown);
    dropdown.classList.add("nav-dropdown-open");
    dropdown.classList.add("is-open");
    var trigger = dropdown.querySelector("[data-navbar-dropdown-trigger]");
    var panel = dropdown.querySelector(".nav-dropdown-content");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (panel) panel.hidden = false;
  }

  function bindDesktopMenuDropdown(navbar, dropdown) {
    var trigger = dropdown.querySelector("[data-navbar-dropdown-trigger]");
    if (!trigger) return [];
    function onEnter() {
      if (window.innerWidth <= 768) return;
      openDropdown(navbar, dropdown);
    }
    function onLeave() {
      if (window.innerWidth <= 768) return;
      closeDropdown(dropdown);
    }
    function onFocusIn() {
      openDropdown(navbar, dropdown);
    }
    function onFocusOut(event) {
      if (!dropdown.contains(event.relatedTarget)) {
        closeDropdown(dropdown);
      }
    }
    dropdown.addEventListener("mouseenter", onEnter);
    dropdown.addEventListener("mouseleave", onLeave);
    dropdown.addEventListener("focusin", onFocusIn);
    dropdown.addEventListener("focusout", onFocusOut);
    return [
      function () { dropdown.removeEventListener("mouseenter", onEnter); },
      function () { dropdown.removeEventListener("mouseleave", onLeave); },
      function () { dropdown.removeEventListener("focusin", onFocusIn); },
      function () { dropdown.removeEventListener("focusout", onFocusOut); },
    ];
  }

  function bindClickDropdown(navbar, dropdown, onOpen) {
    var trigger = dropdown.querySelector("[data-navbar-dropdown-trigger]");
    if (!trigger) return [];
    function onTriggerClick(event) {
      var panel = dropdown.querySelector(".nav-dropdown-content");
      var isOpen = panel && !panel.hidden;
      if (isOpen) closeDropdown(dropdown);
      else {
        openDropdown(navbar, dropdown);
        if (typeof onOpen === "function") onOpen();
      }
      event.preventDefault();
      event.stopPropagation();
    }
    function onKeydown(event) {
      if (event.key === "Enter" || event.key === " ") {
        onTriggerClick(event);
      }
    }
    trigger.addEventListener("click", onTriggerClick);
    trigger.addEventListener("keydown", onKeydown);
    return [
      function () { trigger.removeEventListener("click", onTriggerClick); },
      function () { trigger.removeEventListener("keydown", onKeydown); },
    ];
  }

  function wireThemeToggle(navbar) {
    navbar.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var root = document.documentElement;
        var current = root.getAttribute("data-theme") || getPreferredTheme();
        var next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        if (typeof localStorage !== "undefined") localStorage.setItem("erp_theme", next);
        btn.innerHTML = next === "dark" ? "&#9790;" : "&#9788;";
        btn.setAttribute("data-theme-value", next);
      });
    });
  }

  function wireDropdowns(navbar, opts, loadNotificationList) {
    var cleanups = [];
    navbar.querySelectorAll(".nav-dropdown").forEach(function (dropdown) {
      var mode = dropdown.getAttribute("data-dropdown-mode") || "click";
      var trigger = dropdown.querySelector("a, button");
      if (trigger) trigger.setAttribute("data-navbar-dropdown-trigger", "true");
      var panel = dropdown.querySelector(".nav-dropdown-content");
      if (panel) panel.hidden = true;
      if (mode === "menu") {
        cleanups = cleanups.concat(bindDesktopMenuDropdown(navbar, dropdown));
        var onMenuTriggerClick = function (event) {
          if (window.innerWidth > 768) return;
          var isOpen = panel && !panel.hidden;
          if (isOpen) closeDropdown(dropdown);
          else openDropdown(navbar, dropdown);
          event.preventDefault();
          event.stopPropagation();
        };
        if (trigger) {
          trigger.addEventListener("click", onMenuTriggerClick);
          cleanups.push(function () { trigger.removeEventListener("click", onMenuTriggerClick); });
        }
      } else {
        cleanups = cleanups.concat(bindClickDropdown(navbar, dropdown, dropdown.classList.contains("notification-bell") ? loadNotificationList : null));
      }
    });

    function onDocumentClick(event) {
      if (!navbar.contains(event.target)) closeAllDropdowns(navbar);
    }
    function onDocumentKeydown(event) {
      if (event.key !== "Escape") return;
      closeAllDropdowns(navbar);
      var active = navbar.querySelector("[data-navbar-dropdown-trigger][aria-expanded='true']");
      if (active) active.focus();
    }
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeydown);
    cleanups.push(function () { document.removeEventListener("click", onDocumentClick); });
    cleanups.push(function () { document.removeEventListener("keydown", onDocumentKeydown); });
    return cleanups;
  }

  function wireSessionActions(navbar) {
    navbar.querySelectorAll(".company-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = parseInt(btn.getAttribute("data-company-id"), 10);
        if (!cid) return;
        fetch("/web/session/set_current_company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ company_id: cid }),
        }).then(function (response) {
          if (!response.ok) return;
          if (window.Services && window.Services.session) window.Services.session.clearCache();
          window.location.reload();
        });
      });
    });

    navbar.querySelectorAll(".lang-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang");
        if (!lang) return;
        fetch("/web/session/set_lang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lang: lang }),
        }).then(function (response) {
          if (!response.ok) return;
          if (window.Services && window.Services.session) window.Services.session.clearCache();
          window.location.reload();
        });
      });
    });
  }

  function wireNotifications(navbar) {
    var badge = navbar.querySelector(".notification-badge");
    var list = navbar.querySelector("#notification-list");
    var markAll = navbar.querySelector(".mark-all-read");

    function loadNotificationCount() {
      fetch("/mail/notifications", { credentials: "include" })
        .then(function (response) { return response.json(); })
        .then(function (items) {
          var count = (items && items.length) || 0;
          if (!badge) return;
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.hidden = !count;
        })
        .catch(function () {});
    }

    function loadNotificationList() {
      if (!list) return;
      fetch("/mail/notifications", { credentials: "include" })
        .then(function (response) { return response.json(); })
        .then(function (items) {
          list.innerHTML = renderNotificationItems(items);
          list.querySelectorAll(".notification-item").forEach(function (item) {
            item.addEventListener("click", function () {
              closeAllDropdowns(navbar);
            });
          });
        })
        .catch(function () {
          list.innerHTML = '<p class="o-navbar-empty">Could not load</p>';
        });
    }

    if (markAll) {
      markAll.addEventListener("click", function () {
        var headers = { "Content-Type": "application/json" };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
          Object.assign(headers, window.Services.session.getAuthHeaders());
        }
        fetch("/mail/notifications/mark_read", {
          method: "POST",
          credentials: "include",
          headers: headers,
          body: JSON.stringify({ all: true }),
        }).then(function () {
          loadNotificationCount();
          loadNotificationList();
        });
      });
    }

    loadNotificationCount();
    return loadNotificationList;
  }

  function renderDefault(opts) {
    var navbar = opts && opts.navbar;
    if (!navbar) return false;

    var brandName = opts.brandName || "Foundry One";
    var useSidebar = !!(opts && opts.appSidebar);
    var selectedAppName = opts.selectedAppName || "";
    var staleBannerHtml = opts.staleBannerHtml || "";
    var navItems = Array.isArray(opts.navItems) ? opts.navItems : [];
    var userCompanies = opts.userCompanies || null;
    var userLangs = Array.isArray(opts.userLangs) ? opts.userLangs : [];
    var currentLang = opts.currentLang || "en_US";
    var currentLanguage = userLangs.find(function (lang) { return lang.code === currentLang; }) || userLangs[0] || null;
    var currentCompany = userCompanies && userCompanies.current_company ? userCompanies.current_company : null;
    var theme = getPreferredTheme(opts.theme);

    var html = "";
    html += '<div class="o-navbar-shell">';
    if (useSidebar) {
      html += '<button type="button" class="nav-hamburger o-navbar-icon-button" aria-label="Open menu">&#9776;</button>';
      html += '<button type="button" class="nav-sidebar-toggle o-navbar-icon-button" aria-label="Collapse sidebar" title="Collapse menu" aria-expanded="true">&#9664;</button>';
    } else {
      html += '<button type="button" class="nav-hamburger o-navbar-icon-button o-navbar-icon-button--ghost" aria-label="Toggle menu" hidden>&#9776;</button>';
    }
    html += '<span class="nav-toolbar-left o-navbar-toolbar-left">';
    html += '<a href="#home" class="logo logo-link o-navbar-brand-lockup" title="Apps"><span class="o-navbar-brand-emblem" aria-hidden="true">F1</span><span class="o-navbar-brand-wordmark">' + escHtml(brandName) + "</span></a>";
    if (useSidebar) {
      html += '<button type="button" id="nav-apps-home" class="nav-link o-navbar-link nav-apps-home" title="Apps">Apps</button>';
      if (selectedAppName) {
        html += '<span class="nav-current-app o-navbar-current-app">' + escHtml(selectedAppName) + "</span>";
      }
    }
    if (!useSidebar) {
      html += '<nav role="navigation" class="nav-menu o-navbar-menu" aria-label="Main navigation">';
      if (staleBannerHtml) {
        html += '<span class="nav-menu-stale-banner o-navbar-status-banner">' + staleBannerHtml + "</span>";
      }
      html += navItems.map(renderMenuItem).join("");
      html += "</nav>";
    }
    html += "</span>";

    html += '<span class="nav-user o-navbar-utility">';
    if (userCompanies && userCompanies.allowed_companies && userCompanies.allowed_companies.length > 1) {
      html += '<span class="nav-dropdown company-switcher o-navbar-dropdown" data-dropdown-mode="click">';
      html += '<button type="button" class="nav-link o-navbar-link o-navbar-utility-button company-switcher-btn" title="Switch company" aria-haspopup="true" aria-expanded="false">' + escHtml(currentCompany && currentCompany.name ? currentCompany.name : "Company") + '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span></button>';
      html += '<span class="nav-dropdown-content company-dropdown o-navbar-dropdown-panel" hidden>';
      userCompanies.allowed_companies.forEach(function (company) {
        var active = currentCompany && company.id === currentCompany.id ? " nav-link-active is-active" : "";
        html += '<button type="button" class="nav-link o-navbar-link o-navbar-dropdown-button company-option' + active + '" data-company-id="' + escAttr(company.id || "") + '">' + escHtml(company.name || "") + "</button>";
      });
      html += "</span></span>";
    } else if (currentCompany) {
      html += '<span class="nav-company-badge o-navbar-chip" title="Current company">' + escHtml(currentCompany.name || "") + "</span>";
    }

    if (userLangs.length > 1) {
      html += '<span class="nav-dropdown lang-switcher o-navbar-dropdown" data-dropdown-mode="click">';
      html += '<button type="button" class="nav-link o-navbar-link o-navbar-utility-button lang-switcher-btn" title="Language" aria-haspopup="true" aria-expanded="false">' + escHtml((currentLanguage && (currentLanguage.name || currentLanguage.code)) || "Lang") + '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span></button>';
      html += '<span class="nav-dropdown-content lang-dropdown o-navbar-dropdown-panel" hidden>';
      userLangs.forEach(function (lang) {
        var active = lang.code === currentLang ? " nav-link-active is-active" : "";
        html += '<button type="button" class="nav-link o-navbar-link o-navbar-dropdown-button lang-option' + active + '" data-lang="' + escAttr(lang.code || "") + '">' + escHtml(lang.name || lang.code || "") + "</button>";
      });
      html += "</span></span>";
    }

    html += '<button type="button" class="nav-link o-navbar-link o-navbar-icon-button theme-toggle" title="Toggle dark mode" aria-label="Toggle theme" data-theme-value="' + escAttr(theme) + '">' + (theme === "dark" ? "&#9790;" : "&#9788;") + "</button>";
    html += '<span class="nav-dropdown notification-bell o-navbar-dropdown" data-dropdown-mode="click">';
    html += '<button type="button" class="nav-link o-navbar-link o-navbar-icon-button notification-bell-btn" title="Notifications" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">&#128276;<span class="notification-badge o-navbar-badge" hidden>0</span></button>';
    html += '<span class="nav-dropdown-content notification-dropdown o-navbar-dropdown-panel o-navbar-notification-panel" hidden>';
    html += '<div class="notification-header o-navbar-panel-header"><span>Notifications</span><button type="button" class="nav-link o-navbar-link mark-all-read">Mark all read</button></div>';
    html += '<div id="notification-list" class="o-navbar-notification-list"><p class="o-navbar-empty">Loading notifications...</p></div>';
    html += "</span></span>";

    html += '<a href="#discuss" class="nav-link o-navbar-link" title="Discuss">Discuss</a>';
    html += '<span class="o-systray-registry"></span>';
    html += '<a href="/web/logout" class="nav-link o-navbar-link">Logout</a>';
    html += "</span></div>";

    navbar.innerHTML = html;
    if (window.Services && window.Services.debugMenu && typeof window.Services.debugMenu.mount === "function") {
      window.Services.debugMenu.mount(navbar);
    }

    if (navbar.__erpNavbarCleanup && Array.isArray(navbar.__erpNavbarCleanup)) {
      navbar.__erpNavbarCleanup.forEach(function (cleanup) {
        if (typeof cleanup === "function") cleanup();
      });
    }

    var cleanups = [];
    wireThemeToggle(navbar);
    wireSessionActions(navbar);
    var loadNotificationList = wireNotifications(navbar);
    cleanups = cleanups.concat(wireDropdowns(navbar, opts, loadNotificationList));

    var appsHome = navbar.querySelector("#nav-apps-home");
    if (appsHome) {
      var onAppsHomeClick = function () {
        window.location.hash = "#home";
      };
      appsHome.addEventListener("click", onAppsHomeClick);
      cleanups.push(function () { appsHome.removeEventListener("click", onAppsHomeClick); });
    }

    navbar.__erpNavbarCleanup = cleanups;
    return true;
  }

  function render(opts) {
    if (_impl) return !!_impl(opts || {});
    return renderDefault(opts || {});
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.Navbar = {
    setImpl: setImpl,
    render: render,
  };
})();
