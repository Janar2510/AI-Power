/**
 * Legacy main: navbar HTML + systray hook + notifications (Phase 806).
 * Loaded before legacy_main_chrome_block.js; ctx via install(ctx).
 */
(function () {
  var _ctx = {};

  function install(ctx) {
    _ctx = ctx || {};
  }

function renderNavbar(userCompanies, userLangs, currentLang) {
  if (_ctx.modernShellOwner && window.__erpModernShellController) {
    window.__erpModernShellController.applyNavContext({
      userCompanies: userCompanies || null,
      userLangs: userLangs || [],
      currentLang: currentLang || "en_US",
    });
    return true;
  }
  if (_ctx.NavbarCore && typeof _ctx.NavbarCore.render === "function") {
    var coreHandled = _ctx.NavbarCore.render({
      navbar: _ctx.navbar,
      appShell: _ctx.appShell,
      appSidebar: _ctx.appSidebar,
      userCompanies: userCompanies || [],
      userLangs: userLangs || [],
      currentLang: currentLang || "en_US",
      viewsSvc: _ctx.viewsSvc,
    });
    if (coreHandled) return;
  }
  if (!_ctx.navbar) return;
  userLangs = userLangs || [];
  currentLang = currentLang || 'en_US';
  var menus = (_ctx.viewsSvc && _ctx.viewsSvc.getMenus()) ? _ctx.viewsSvc.getMenus() : [];
  var tree = menus.length ? _ctx.buildMenuTree(menus) : [];
  var appRoots = _ctx.getAppRoots(tree, menus);
  var routeHash = (window.location.hash || '#home').replace(/^#/, '');
  var routeBase = routeHash.split('?')[0];
  /* Home / apps grid: do not use stored app or first-app fallback for chrome — hash drives main
     content (#home) while stored erp_sidebar_app made sidebar/header show a different app (Phase nav fix). */
  var atHome = routeBase === '' || routeBase === 'home';
  var autoAppId = _ctx.getAppIdForRoute(routeBase, menus);
  var storedAppId = typeof localStorage !== 'undefined' ? (localStorage.getItem('erp_sidebar_app') || '') : '';
  var selectedAppId = '';
  if (atHome) {
    selectedAppId = autoAppId || '';
    if (typeof localStorage !== 'undefined' && !selectedAppId) {
      try {
        localStorage.removeItem('erp_sidebar_app');
      } catch (e) { /* noop */ }
    }
  } else {
    selectedAppId = autoAppId || storedAppId || (appRoots[0] && appRoots[0].menu && appRoots[0].menu.id) || '';
  }
  var selectedRoot = appRoots.find(function (n) {
    return String((n.menu && n.menu.id) || '') === String(selectedAppId);
  }) || null;
  var selectedAppName = (selectedRoot && selectedRoot.menu && selectedRoot.menu.name) ? selectedRoot.menu.name : '';
  if (selectedAppId && typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_app', selectedAppId);
  var useSidebar = !!_ctx.appSidebar;
  var staleBannerHtml = '';
  if (menus.length === 0) {
    staleBannerHtml = 'Navigation menus missing. Run: <code style="padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--color-text) 12%,transparent)">erp-bin db upgrade -d ' +
      _ctx.escNavHtml(window.Session && window.Session.db ? String(window.Session.db) : 'erp') + '</code>';
  }
  var html = '';
  if (useSidebar) {
    html += '<button type="button" class="nav-hamburger" aria-label="Open menu">&#9776;</button>';
    html += '<button type="button" class="nav-sidebar-toggle" aria-label="Collapse sidebar" title="Collapse menu" aria-expanded="true">&#9664;</button>';
  } else {
    html += '<button type="button" class="nav-hamburger" aria-label="Toggle menu" style="display:none">&#9776;</button>';
  }
  html += '<span class="nav-toolbar-left"><a href="#home" class="logo logo-link" title="Apps">ERP Platform</a>';
  if (useSidebar) {
    html += '<button type="button" id="nav-apps-home" class="nav-link nav-apps-home" title="Apps">Apps</button>';
    if (selectedAppName) {
      html += '<span class="nav-current-app">' + _ctx.escNavHtml(selectedAppName) + '</span>';
    }
  }
  if (!useSidebar) {
    html += '<nav role="navigation" class="nav-menu" aria-label="Main navigation" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">';
    if (staleBannerHtml) {
      html += '<span class="nav-menu-stale-banner" style="padding:0.25rem 0.5rem;background:var(--color-warning);color:var(--color-text);font-size:0.85rem;border-radius:var(--radius-sm)">' + staleBannerHtml + '</span>';
    }
    if (menus.length) {
      tree.forEach(function (node) {
        const m = node.menu;
        const action = m.action ? _ctx.viewsSvc.getAction(m.action) : null;
        const route = action ? _ctx.actionToRoute(action) : _ctx.menuToRoute(m);
        const href = route ? '#' + route : '#';
        const cls = 'nav-link' + (route ? '' : ' nav-link-disabled');
        if (node.children.length) {
          html += '<span class="nav-dropdown" style="position:relative;display:inline-block">';
          html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
          html += '<span class="nav-dropdown-content" style="display:none;position:absolute;top:100%;left:0;background:#1a1a2e;min-width:140px;padding:0.5rem 0;border-radius:4px;z-index:100">';
          node.children.forEach(function (ch) {
            const cm = ch.menu;
            const caction = cm.action ? _ctx.viewsSvc.getAction(cm.action) : null;
            const croute = caction ? _ctx.actionToRoute(caction) : _ctx.menuToRoute(cm);
            const chref = croute ? '#' + croute : '#';
            html += '<a href="' + chref + '" class="nav-link" style="display:block;padding:0.5rem 1rem;white-space:nowrap" data-menu-id="' + (cm.id || '').replace(/"/g, '&quot;') + '">' + (cm.name || '').replace(/</g, '&lt;') + '</a>';
          });
          html += '</span></span>';
        } else {
          html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
        }
      });
    }
    html += '</nav>';
  }
  html += '</span><span class="nav-user" style="margin-left:auto;display:flex;align-items:center;gap:0.75rem">';
  if (userCompanies && userCompanies.allowed_companies && userCompanies.allowed_companies.length > 1) {
    const cur = userCompanies.current_company;
    html += '<span class="nav-dropdown company-switcher" style="position:relative;display:inline-block">';
    html += '<button type="button" class="nav-link company-switcher-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Switch company">';
    html += (cur && cur.name ? cur.name : 'Company') + ' &#9662;</button>';
    html += '<span class="nav-dropdown-content company-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:160px;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100">';
    userCompanies.allowed_companies.forEach(function (c) {
      const active = cur && c.id === cur.id ? ' nav-link-active' : '';
      html += '<button type="button" class="nav-link company-option' + active + '" style="display:block;width:100%;text-align:left;padding:0.5rem 1rem;background:none;border:none;cursor:pointer;font:inherit;color:inherit" data-company-id="' + (c.id || '') + '">' + (c.name || '').replace(/</g, '&lt;') + '</button>';
    });
    html += '</span></span>';
  } else if (userCompanies && userCompanies.current_company) {
    html += '<span class="nav-company-badge" title="Current company">' + (userCompanies.current_company.name || '').replace(/</g, '&lt;') + '</span>';
  }
  if (userLangs && userLangs.length > 1) {
    const cur = userLangs.find(function (l) { return l.code === currentLang; }) || userLangs[0];
    html += '<span class="nav-dropdown lang-switcher" style="position:relative;display:inline-block">';
    html += '<button type="button" class="nav-link lang-switcher-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Language">' + (cur.name || cur.code || 'Lang').replace(/</g, '&lt;') + ' &#9662;</button>';
    html += '<span class="nav-dropdown-content lang-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:120px;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100">';
    userLangs.forEach(function (l) {
      const active = l.code === currentLang ? ' nav-link-active' : '';
      html += '<button type="button" class="nav-link lang-option' + active + '" style="display:block;width:100%;text-align:left;padding:0.5rem 1rem;background:none;border:none;cursor:pointer;font:inherit;color:inherit" data-lang="' + (l.code || '').replace(/"/g, '&quot;') + '">' + (l.name || l.code || '').replace(/</g, '&lt;') + '</button>';
    });
    html += '</span></span>';
  }
  const theme = (typeof localStorage !== 'undefined' && localStorage.getItem('erp_theme')) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html += '<button type="button" class="nav-link theme-toggle" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit" title="Toggle dark mode" aria-label="Toggle theme">' + (theme === 'dark' ? '\u263D' : '\u263C') + '</button>';
  html += '<span class="nav-dropdown notification-bell" style="position:relative;display:inline-block">';
  html += '<button type="button" class="nav-link notification-bell-btn" style="background:none;border:none;cursor:pointer;font:inherit;color:inherit;position:relative" title="Notifications" aria-label="Notifications">&#128276;</button>';
  html += '<span class="notification-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#c00;color:white;font-size:0.7rem;min-width:1.2em;height:1.2em;border-radius:50%;text-align:center;line-height:1.2em;padding:0 4px">0</span>';
  html += '<span class="nav-dropdown-content notification-dropdown" style="display:none;position:absolute;top:100%;right:0;min-width:280px;max-width:360px;max-height:400px;overflow-y:auto;padding:0.5rem 0;background:#1a1a2e;border-radius:4px;z-index:100;margin-top:4px">';
  html += '<div class="notification-header" style="padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center"><span>Notifications</span><button type="button" class="nav-link mark-all-read" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:var(--text-muted)">Mark all read</button></div>';
  html += '<div id="notification-list" style="max-height:320px;overflow-y:auto"></div>';
  html += '</span></span>';
  html += '<a href="#discuss" class="nav-link" title="Discuss">Discuss</a>';
  html += '<span class="o-systray-registry"></span>';
  html += '<a href="/web/logout" class="nav-link">Logout</a>';
  html += '</span>';
  _ctx.navbar.innerHTML = html;
  if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === 'function') {
    window.__erpNavbarContract.markDelegated(_ctx.navbar);
  }
  _ctx.renderSystrayMount();
  if (_ctx.appSidebar) {
    var sidebarTree = tree;
    if (appRoots.length && selectedAppId) {
      if (selectedRoot) {
        sidebarTree = selectedRoot.children && selectedRoot.children.length
          ? selectedRoot.children
          : [selectedRoot];
      }
    }
    if (_ctx.SidebarCore && typeof _ctx.SidebarCore.render === "function") {
      _ctx.appSidebar.innerHTML = _ctx.SidebarCore.render({
        tree: sidebarTree,
        staleBannerHtml: staleBannerHtml,
        buildSidebarNavHtml: _ctx.buildSidebarNavHtml,
      }) || _ctx.buildSidebarNavHtml(sidebarTree, staleBannerHtml);
      if (typeof _ctx.SidebarCore.wire === "function") {
        _ctx.SidebarCore.wire({ wireSidebarAfterRender: _ctx.wireSidebarAfterRender });
      } else {
        _ctx.wireSidebarAfterRender();
      }
    } else {
      _ctx.appSidebar.innerHTML = _ctx.buildSidebarNavHtml(sidebarTree, staleBannerHtml);
      _ctx.wireSidebarAfterRender();
    }
  }
  var appsHomeBtn = _ctx.navbar.querySelector('#nav-apps-home');
  if (appsHomeBtn) {
    appsHomeBtn.addEventListener('click', function () {
      window.location.hash = '#home';
    });
  }
  var hamburger = _ctx.navbar.querySelector('.nav-hamburger');
  var navMenu = _ctx.navbar.querySelector('.nav-menu');
  if (hamburger && navMenu && !_ctx.appSidebar) {
    function updateHamburgerVisibility() {
      hamburger.style.display = (window.innerWidth <= 768) ? 'flex' : 'none';
      if (window.innerWidth > 768) navMenu.classList.remove('nav-menu-open');
    }
    if (window.innerWidth <= 768) hamburger.style.display = 'flex';
    hamburger.onclick = function () {
      navMenu.classList.toggle('nav-menu-open');
    };
    window.addEventListener('resize', updateHamburgerVisibility);
  }
  if (_ctx.appSidebar && hamburger) {
    function syncMobileHamburgerVisibility() {
      hamburger.style.display = (window.innerWidth <= 1023) ? 'inline-flex' : 'none';
    }
    syncMobileHamburgerVisibility();
    window.addEventListener('resize', syncMobileHamburgerVisibility);
  }
  _ctx.navbar.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.onclick = function () {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      if (typeof localStorage !== 'undefined') localStorage.setItem('erp_theme', next);
      btn.textContent = next === 'dark' ? '\u263D' : '\u263C';
    };
  });
  _ctx.navbar.querySelectorAll('.nav-dropdown').forEach(function (dd) {
    const label = dd.querySelector('a') || dd.querySelector('button');
    const content = dd.querySelector('.nav-dropdown-content');
    if (label && content) {
      var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouch && window.innerWidth <= 768) {
        label.onclick = function (e) {
          if (dd.classList.contains('nav-dropdown-open')) {
            dd.classList.remove('nav-dropdown-open');
            content.style.display = 'none';
          } else {
            _ctx.navbar.querySelectorAll('.nav-dropdown-open').forEach(function (o) {
              o.classList.remove('nav-dropdown-open');
              var c = o.querySelector('.nav-dropdown-content');
              if (c) c.style.display = 'none';
            });
            dd.classList.add('nav-dropdown-open');
            content.style.display = 'block';
          }
          e.preventDefault();
          e.stopPropagation();
        };
      } else {
        label.onmouseenter = function () { content.style.display = 'block'; };
        dd.onmouseleave = function () { content.style.display = 'none'; };
      }
    }
  });
  _ctx.navbar.querySelectorAll('.company-option').forEach(function (btn) {
    btn.onclick = function () {
      const cid = parseInt(btn.getAttribute('data-company-id'), 10);
      if (!cid) return;
      fetch('/web/session/set_current_company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_id: cid })
      }).then(function (r) {
        if (r.ok) {
          if (window.Services && window.Services.session) window.Services.session.clearCache();
          window.location.reload();
        }
      });
    };
  });
  _ctx.navbar.querySelectorAll('.lang-option').forEach(function (btn) {
    btn.onclick = function () {
      const lang = btn.getAttribute('data-lang');
      if (!lang) return;
      fetch('/web/session/set_lang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lang: lang })
      }).then(function (r) {
        if (r.ok) {
          if (window.Services && window.Services.session) window.Services.session.clearCache();
          window.location.reload();
        }
      });
    };
  });
  var bellBtn = _ctx.navbar.querySelector('.notification-bell-btn');
  var bellDropdown = _ctx.navbar.querySelector('.notification-dropdown');
  var badgeEl = _ctx.navbar.querySelector('.notification-badge');
  function loadNotificationCount() {
    fetch('/mail/notifications', { credentials: 'include' }).then(function (r) { return r.json(); }).then(function (list) {
      var n = (list && list.length) || 0;
      if (badgeEl) {
        badgeEl.textContent = n > 99 ? '99+' : String(n);
        badgeEl.style.display = n > 0 ? 'block' : 'none';
      }
    }).catch(function () {});
  }
  function loadNotificationList() {
    var listEl = document.getElementById('notification-list');
    if (!listEl) return;
    fetch('/mail/notifications', { credentials: 'include' }).then(function (r) { return r.json(); }).then(function (list) {
      if (!list || !list.length) {
        listEl.innerHTML = '<p style="padding:1rem;color:var(--text-muted);margin:0">No new notifications</p>';
        return;
      }
      var modelToRoute = { 'res.partner': 'contacts', 'crm.lead': 'leads', 'sale.order': 'orders', 'mail.channel': 'discuss' };
      listEl.innerHTML = list.map(function (n) {
        var route = modelToRoute[n.res_model] || (n.res_model ? (n.res_model || '').replace(/\\./g, '_') : '');
        var href = (route === 'discuss' && n.res_id) ? '#discuss/' + n.res_id : (route ? '#' + route + '/edit/' + (n.res_id || '') : '#');
        var body = (n.body || '').replace(/</g, '&lt;').substring(0, 80);
        return '<a href="' + href + '" class="notification-item" data-id="' + (n.id || '') + '" style="display:block;padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);text-decoration:none;color:inherit;font-size:0.9rem" onclick="document.querySelector(\'.notification-dropdown\').style.display=\'none\'">' + body + '<br><span style="font-size:0.75rem;color:var(--text-muted)">' + (n.date || '').substring(0, 16) + '</span></a>';
      }).join('');
    }).catch(function () { listEl.innerHTML = '<p style="padding:1rem;color:var(--text-muted);margin:0">Could not load</p>'; });
  }
  if (bellBtn && bellDropdown) {
    bellBtn.onclick = function () {
      var isOpen = bellDropdown.style.display === 'block';
      bellDropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) loadNotificationList();
    };
    document.addEventListener('click', function (e) {
      if (bellDropdown && bellDropdown.style.display === 'block' && !bellDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
        bellDropdown.style.display = 'none';
      }
    });
  }
  if (_ctx.navbar.querySelector('.mark-all-read')) {
    _ctx.navbar.querySelector('.mark-all-read').onclick = function () {
      var markReadHdrs = { 'Content-Type': 'application/json' };
      if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(markReadHdrs, window.Services.session.getAuthHeaders());
      fetch('/mail/notifications/mark_read', { method: 'POST', credentials: 'include', headers: markReadHdrs, body: JSON.stringify({ all: true }) }).then(function () { loadNotificationCount(); loadNotificationList(); });
    };
  }
  loadNotificationCount();
}

  window.__ERP_LEGACY_MAIN_NAVBAR = {
    install: install,
    renderNavbar: renderNavbar,
  };
})();
