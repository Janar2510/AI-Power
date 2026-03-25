/**
 * Stable navbar shell HTML (Foundry One / app-shell.md): glass search row + chrome row.
 * Loaded before core/navbar.js; AppCore.Navbar.render delegates string build here.
 */
(function () {
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
      '<a href="' +
      escAttr(href) +
      '" class="' +
      cls +
      '" data-menu-id="' +
      escAttr(item.id || "") +
      '" aria-haspopup="true" aria-expanded="false">' +
      escHtml(item.name || "") +
      '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span>' +
      "</a>" +
      '<span class="nav-dropdown-content o-navbar-dropdown-panel" hidden>' +
      item.children
        .map(function (child) {
          return (
            '<a href="' +
            escAttr(child.href || "#") +
            '" class="nav-link o-navbar-link o-navbar-dropdown-link" data-menu-id="' +
            escAttr(child.id || "") +
            '">' +
            escHtml(child.name || "") +
            "</a>"
          );
        })
        .join("") +
      "</span>" +
      "</span>"
    );
  }

  /**
   * @param {object} opts — same shape as AppCore.Navbar.render / renderDefault
   * @returns {string} inner HTML for #navbar
   */
  function buildHtml(opts) {
    opts = opts || {};
    var brandName = opts.brandName || "Foundry One";
    var useSidebar = !!opts.appSidebar;
    var selectedAppName = opts.selectedAppName || "";
    var staleBannerHtml = opts.staleBannerHtml || "";
    var navItems = Array.isArray(opts.navItems) ? opts.navItems : [];
    var userCompanies = opts.userCompanies || null;
    var userLangs = Array.isArray(opts.userLangs) ? opts.userLangs : [];
    var currentLang = opts.currentLang || "en_US";
    var currentLanguage = userLangs.find(function (lang) {
      return lang.code === currentLang;
    }) || userLangs[0] || null;
    var currentCompany = userCompanies && userCompanies.current_company ? userCompanies.current_company : null;
    var theme = getPreferredTheme(opts.theme);

    var html = "";
    html += '<div class="o-navbar-shell o-navbar-glass">';
    html += '<div class="o-navbar-glass-row" role="search">';
    html += '<div class="o-navbar-search-host">';
    html +=
      '<input type="search" class="o-global-search" id="o-global-search-input" placeholder="Search or command…" aria-label="Global search" autocomplete="off" />';
    html += "</div></div>";

    html += '<div class="o-navbar-chrome-row">';
    if (useSidebar) {
      html += '<button type="button" class="nav-hamburger o-navbar-icon-button" aria-label="Open menu">&#9776;</button>';
      html +=
        '<button type="button" class="nav-sidebar-toggle o-navbar-icon-button" aria-label="Collapse sidebar" title="Collapse menu" aria-expanded="true">&#9664;</button>';
    } else {
      html +=
        '<button type="button" class="nav-hamburger o-navbar-icon-button o-navbar-icon-button--ghost" aria-label="Toggle menu" hidden>&#9776;</button>';
    }
    html += '<span class="nav-toolbar-left o-navbar-toolbar-left">';
    html +=
      '<a href="#home" class="logo logo-link o-navbar-brand-lockup" title="Apps"><span class="o-navbar-brand-emblem" aria-hidden="true">F1</span><span class="o-navbar-brand-wordmark">' +
      escHtml(brandName) +
      "</span></a>";
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
      html +=
        '<button type="button" class="nav-link o-navbar-link o-navbar-utility-button company-switcher-btn" title="Switch company" aria-haspopup="true" aria-expanded="false">' +
        escHtml(currentCompany && currentCompany.name ? currentCompany.name : "Company") +
        '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span></button>';
      html += '<span class="nav-dropdown-content company-dropdown o-navbar-dropdown-panel" hidden>';
      userCompanies.allowed_companies.forEach(function (company) {
        var active = currentCompany && company.id === currentCompany.id ? " nav-link-active is-active" : "";
        html +=
          '<button type="button" class="nav-link o-navbar-link o-navbar-dropdown-button company-option' +
          active +
          '" data-company-id="' +
          escAttr(company.id || "") +
          '">' +
          escHtml(company.name || "") +
          "</button>";
      });
      html += "</span></span>";
    } else if (currentCompany) {
      html += '<span class="nav-company-badge o-navbar-chip" title="Current company">' + escHtml(currentCompany.name || "") + "</span>";
    }

    if (userLangs.length > 1) {
      html += '<span class="nav-dropdown lang-switcher o-navbar-dropdown" data-dropdown-mode="click">';
      html +=
        '<button type="button" class="nav-link o-navbar-link o-navbar-utility-button lang-switcher-btn" title="Language" aria-haspopup="true" aria-expanded="false">' +
        escHtml((currentLanguage && (currentLanguage.name || currentLanguage.code)) || "Lang") +
        '<span class="o-navbar-caret" aria-hidden="true">&#9662;</span></button>';
      html += '<span class="nav-dropdown-content lang-dropdown o-navbar-dropdown-panel" hidden>';
      userLangs.forEach(function (lang) {
        var active = lang.code === currentLang ? " nav-link-active is-active" : "";
        html +=
          '<button type="button" class="nav-link o-navbar-link o-navbar-dropdown-button lang-option' +
          active +
          '" data-lang="' +
          escAttr(lang.code || "") +
          '">' +
          escHtml(lang.name || lang.code || "") +
          "</button>";
      });
      html += "</span></span>";
    }

    html +=
      '<button type="button" class="nav-link o-navbar-link o-navbar-icon-button theme-toggle" title="Toggle dark mode" aria-label="Toggle theme" data-theme-value="' +
      escAttr(theme) +
      '">' +
      (theme === "dark" ? "&#9790;" : "&#9788;") +
      "</button>";
    html += '<span class="nav-dropdown notification-bell o-navbar-dropdown" data-dropdown-mode="click">';
    html +=
      '<button type="button" class="nav-link o-navbar-link o-navbar-icon-button notification-bell-btn" title="Notifications" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">&#128276;<span class="notification-badge o-navbar-badge" hidden>0</span></button>';
    html += '<span class="nav-dropdown-content notification-dropdown o-navbar-dropdown-panel o-navbar-notification-panel" hidden>';
    html +=
      '<div class="notification-header o-navbar-panel-header"><span>Notifications</span><button type="button" class="nav-link o-navbar-link mark-all-read">Mark all read</button></div>';
    html += '<div id="notification-list" class="o-navbar-notification-list"><p class="o-navbar-empty">Loading notifications...</p></div>';
    html += "</span></span>";

    html += '<a href="#discuss" class="nav-link o-navbar-link" title="Discuss">Discuss</a>';
    html += '<span class="o-systray-registry"></span>';
    html += '<a href="/web/logout" class="nav-link o-navbar-link">Logout</a>';
    html += "</span></div></div>";

    return html;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.NavbarChrome = {
    buildHtml: buildHtml,
  };
})();
