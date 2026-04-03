/**
 * Legacy web.assets_web: shell routes (discuss, home, dashboard, settings) + sidebar.
 * Loaded before main.js; sets window.__ERP_SHELL_ROUTES (Phase 1.245 Track D4).
 */
(function () {
  var SR = (window.__ERP_SHELL_ROUTES = window.__ERP_SHELL_ROUTES || {});

  var rpc, viewsSvc, showToast, main, navbar, appShell, appSidebar;
  var getActionStack, setActionStack;
  var actionToRoute, menuToRoute, _warnSidebarMenuDisabled;
  var renderBreadcrumbs, attachBreadcrumbHandlers;
  var navigateActWindowIfAvailable, routeFn;
  var renderNavbar, renderSystrayMount;
  var navContext;

  var DashboardCore, SettingsCore, DiscussViewCore, SidebarCore;

  function _erpShellDebugLog(event, data) {
    try {
      if (typeof localStorage === 'undefined' || localStorage.getItem('erp_debug_mode') !== '1') return;
      if (typeof console !== 'undefined' && console.info) {
        console.info('[erp-shell-debug]', String(event || 'event'), data && typeof data === 'object' ? data : {});
      }
    } catch (e) { /* noop */ }
  }

  SR.install = function (ctx) {
    rpc = ctx.rpc;
    viewsSvc = ctx.viewsSvc;
    showToast = ctx.showToast;
    main = ctx.main;
    navbar = ctx.navbar;
    appShell = ctx.appShell;
    appSidebar = ctx.appSidebar;
    getActionStack = ctx.getActionStack;
    setActionStack = ctx.setActionStack;
    actionToRoute = ctx.actionToRoute;
    menuToRoute = ctx.menuToRoute;
    _warnSidebarMenuDisabled = ctx._warnSidebarMenuDisabled;
    renderBreadcrumbs = ctx.renderBreadcrumbs;
    attachBreadcrumbHandlers = ctx.attachBreadcrumbHandlers;
    navigateActWindowIfAvailable = ctx.navigateActWindowIfAvailable;
    routeFn = ctx.route;
    renderNavbar = ctx.renderNavbar;
    renderSystrayMount = ctx.renderSystrayMount;
    navContext = ctx.navContext || { userCompanies: null, userLangs: [], currentLang: 'en_US' };

    DashboardCore = window.AppCore && window.AppCore.Dashboard;
    SettingsCore = window.AppCore && window.AppCore.Settings;
    DiscussViewCore = window.AppCore && window.AppCore.DiscussView;
    SidebarCore = window.AppCore && window.AppCore.Sidebar;
  };

  /* ------------------------------------------------------------------ */
  /*  Menu tree helpers                                                  */
  /* ------------------------------------------------------------------ */

  function buildMenuTree(menus) {
    var byId = {};
    var roots = [];
    (menus || []).forEach(function (m) {
      byId[m.id || m.name] = { menu: m, children: [] };
    });
    (menus || []).forEach(function (m) {
      var node = byId[m.id || m.name];
      if (!node) return;
      var parentRef = m.parent || '';
      if (!parentRef || !byId[parentRef]) {
        roots.push(node);
      } else {
        byId[parentRef].children.push(node);
      }
    });
    function sortRecursive(nodes) {
      nodes.sort(function (a, b) { return (a.menu.sequence || 0) - (b.menu.sequence || 0); });
      nodes.forEach(function (n) { if (n.children.length) sortRecursive(n.children); });
    }
    sortRecursive(roots);
    return roots;
  }

  function getAppRoots(tree, menus) {
    var byId = {};
    (menus || []).forEach(function (m) { if (m && m.id) byId[m.id] = m; });
    return (tree || []).filter(function (node) {
      var m = node.menu || {};
      if (!m.id) return false;
      if (m.app_id) return m.id === m.app_id;
      return !m.parent || !byId[m.parent];
    });
  }

  function getAppIdForRoute(route, menus) {
    var out = null;
    (menus || []).some(function (m) {
      var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
      var r = action ? actionToRoute(action) : menuToRoute(m);
      if (r && r === route) {
        out = m.app_id || m.id || null;
        return true;
      }
      return false;
    });
    if (out != null) return out;
    var RL = window.__ERP_ROUTE_LEGACY || {};
    var model = RL.getModelForRoute ? RL.getModelForRoute(route) : null;
    if (!model) return null;
    (menus || []).some(function (m) {
      var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
      if (!action) return false;
      var t = action.type || '';
      if (t !== 'ir.actions.act_window' && t !== 'window') return false;
      var rm = action.res_model || action.resModel;
      if (rm && rm === model) {
        out = m.app_id || m.id || null;
        return true;
      }
      return false;
    });
    return out;
  }

  /* ------------------------------------------------------------------ */
  /*  Default navigation from app node (BFS)                             */
  /* ------------------------------------------------------------------ */

  function getDefaultNavFromAppNode(node) {
    if (!node) return null;
    var queue = [node];
    while (queue.length) {
      var cur = queue.shift();
      var m = cur && cur.menu ? cur.menu : null;
      if (m) {
        var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
        var route = action ? actionToRoute(action) : menuToRoute(m);
        if (route) return { menu: m, action: action, route: route };
      }
      var children = cur && cur.children ? cur.children : [];
      for (var i = 0; i < children.length; i++) queue.push(children[i]);
    }
    return null;
  }

  function getDefaultRouteForAppNode(node) {
    var nav = getDefaultNavFromAppNode(node);
    return nav ? nav.route : null;
  }

  /* ------------------------------------------------------------------ */
  /*  App selection                                                      */
  /* ------------------------------------------------------------------ */

  function selectApp(appId) {
    if (!appId) return;
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var selectedRoot = appRoots.find(function (n) {
      return String((n.menu && n.menu.id) || '') === String(appId);
    });
    if (!selectedRoot) {
      _erpShellDebugLog('selectApp_no_selectedRoot', { appId: String(appId), appRootsCount: appRoots.length });
      return;
    }
    if (typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_app', String(appId));
    var nav = getDefaultNavFromAppNode(selectedRoot);
    var targetRoute = nav && nav.route ? nav.route : 'home';
    var nextHash = '#' + targetRoute;
    var menuRef = nav && nav.menu ? nav.menu : {};
    var actionRef = menuRef.action;
    var actionResolved = actionRef && viewsSvc && viewsSvc.getAction ? viewsSvc.getAction(actionRef) : null;
    _erpShellDebugLog('selectApp', {
      appId: String(appId),
      targetRoute: targetRoute,
      hasNav: !!nav,
      menuActionRef: actionRef != null ? String(actionRef) : '',
      actionResolved: !!actionResolved,
    });
    var tookVmPath = navigateActWindowIfAvailable(nav && nav.action, targetRoute, { source: 'selectApp', appId: String(appId) });
    if (tookVmPath) {
      _erpShellDebugLog('selectApp_vm_path', { targetRoute: targetRoute });
      setTimeout(function () {
        try {
          if (typeof localStorage === 'undefined' || localStorage.getItem('erp_debug_mode') !== '1') return;
          var curBase = (window.location.hash || '#home').replace(/^#/, '').split('?')[0] || 'home';
          var wantBase = String(targetRoute || 'home').split('?')[0] || 'home';
          if (wantBase !== 'home' && curBase !== wantBase) {
            _erpShellDebugLog('selectApp_hash_mismatch_after_8s', { current: curBase, expected: wantBase });
          }
        } catch (e) { /* noop */ }
      }, 8000);
      return;
    }
    if (window.location.hash === nextHash) {
      renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
      routeFn();
      return;
    }
    window.location.hash = nextHash;
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar helpers                                                    */
  /* ------------------------------------------------------------------ */

  function escNavHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function sidebarAbbrev(name) {
    var n = String(name || '').trim();
    return n ? n.charAt(0).toUpperCase() : '\u2022';
  }

  function _getSidebarFolds() {
    try { return JSON.parse(localStorage.getItem('erp_sidebar_folds') || '{}'); } catch (e) { return {}; }
  }

  function _setSidebarFolds(folds) {
    try { localStorage.setItem('erp_sidebar_folds', JSON.stringify(folds)); } catch (e) { /* noop */ }
  }

  function _sidebarIconHtml(m) {
    if (m.web_icon_data) {
      return '<img class="o-sidebar-icon" src="' + escNavHtml(m.web_icon_data) + '" alt="" />';
    }
    if (m.web_icon) {
      var parts = (m.web_icon || '').split(',');
      if (parts.length === 1 && /^fa[a-z-]*\s/.test(parts[0].trim())) {
        return '<i class="o-sidebar-icon ' + escNavHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
      if (parts.length >= 1 && parts[0].trim().startsWith('fa')) {
        return '<i class="o-sidebar-icon ' + escNavHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
    }
    return '<span class="o-sidebar-abbrev">' + escNavHtml(sidebarAbbrev(m.name)) + '</span>';
  }

  function _renderSidebarChildren(children, currentHash, depth) {
    var html = '';
    children.forEach(function (ch) {
      var cm = ch.menu;
      var caction = cm.action && viewsSvc ? viewsSvc.getAction(cm.action) : null;
      var croute = caction ? actionToRoute(caction) : menuToRoute(cm);
      var chref = croute ? '#' + croute : '#';
      var hasGrandkids = ch.children && ch.children.length > 0;
      var isActive = croute && currentHash === croute;

      if (hasGrandkids) {
        var folds = _getSidebarFolds();
        var subFolded = folds[cm.id] !== undefined ? folds[cm.id] : true;
        var subFoldedCls = subFolded ? ' o-sidebar-subgroup--folded' : '';
        html += '<div class="o-sidebar-subgroup' + subFoldedCls + '" data-menu-id="' + escNavHtml(cm.id || '') + '">';
        html += '<button type="button" class="o-sidebar-subgroup-head" aria-expanded="' + (subFolded ? 'false' : 'true') + '">';
        html += '<span class="o-sidebar-chevron o-sidebar-chevron--sub" aria-hidden="true">\u25bc</span>';
        html += '<span class="o-sidebar-link-text">' + escNavHtml(cm.name) + '</span>';
        html += '</button>';
        html += '<div class="o-sidebar-subgroup-body">';
        html += _renderSidebarChildren(ch.children, currentHash, depth + 1);
        html += '</div></div>';
      } else {
        if (!croute) _warnSidebarMenuDisabled(cm, cm.action, !!caction, croute);
        var ccls = croute ? 'o-sidebar-link' : 'o-sidebar-link o-sidebar-link-disabled';
        if (isActive) ccls += ' o-sidebar-link--active';
        if (depth > 0) ccls += ' o-sidebar-link--nested';
        html += '<a href="' + escNavHtml(chref) + '" class="' + ccls + '" data-menu-id="' + escNavHtml(cm.id || '') + '">';
        html += '<span class="o-sidebar-link-text">' + escNavHtml(cm.name) + '</span></a>';
      }
    });
    return html;
  }

  function buildSidebarNavHtml(tree, staleInnerHtml) {
    var html = '<div class="o-sidebar-inner"><div class="o-sidebar-scroll">';
    if (staleInnerHtml) {
      html += '<div class="o-sidebar-stale">' + staleInnerHtml + '</div>';
    }
    html += '<nav class="o-sidebar-nav" role="navigation">';
    if (!tree || !tree.length) {
      html += '<p class="o-sidebar-empty">No menu items.</p>';
    } else {
      var currentHash = (location.hash || '#home').replace(/^#/, '');
      var folds = _getSidebarFolds();
      tree.forEach(function (node) {
        var m = node.menu;
        var action = m.action && viewsSvc ? viewsSvc.getAction(m.action) : null;
        var route = action ? actionToRoute(action) : menuToRoute(m);
        var href = route ? '#' + route : '#';
        var hasKids = node.children && node.children.length > 0;
        var iconHtml = _sidebarIconHtml(m);
        if (hasKids) {
          var folded = folds[m.id] !== undefined ? folds[m.id] : true;
          var foldedCls = folded ? ' o-sidebar-category--folded' : '';
          html += '<section class="o-sidebar-category' + foldedCls + '" data-menu-id="' + escNavHtml(m.id || '') + '" data-expanded="' + (folded ? 'false' : 'true') + '">';
          html += '<button type="button" class="o-sidebar-category-head" aria-expanded="' + (folded ? 'false' : 'true') + '">';
          html += '<span class="o-sidebar-chevron" aria-hidden="true">\u25bc</span>';
          html += iconHtml;
          html += '<span class="o-sidebar-category-name">' + escNavHtml(m.name) + '</span>';
          html += '</button>';
          html += '<div class="o-sidebar-category-body">';
          html += _renderSidebarChildren(node.children, currentHash, 0);
          html += '</div></section>';
        } else {
          if (!route) _warnSidebarMenuDisabled(m, m.action, !!action, route);
          var isActive = route && currentHash === route;
          var leafCls = route ? 'o-sidebar-link' : 'o-sidebar-link o-sidebar-link-disabled';
          if (isActive) leafCls += ' o-sidebar-link--active';
          html += '<section class="o-sidebar-category o-sidebar-category--flat">';
          html += '<a href="' + escNavHtml(href) + '" class="' + leafCls + '" data-menu-id="' + escNavHtml(m.id || '') + '">';
          html += iconHtml;
          html += '<span class="o-sidebar-link-text">' + escNavHtml(m.name) + '</span></a></section>';
        }
      });
    }
    html += '</nav></div></div>';
    return html;
  }

  /* ------------------------------------------------------------------ */
  /*  Mobile sidebar / active link                                       */
  /* ------------------------------------------------------------------ */

  function closeMobileSidebar() {
    if (!appShell) return;
    appShell.classList.remove('o-app-shell--sidebar-mobile-open');
    var bd = document.getElementById('o-sidebar-backdrop');
    if (bd) {
      bd.hidden = true;
      bd.setAttribute('aria-hidden', 'true');
    }
  }

  function _updateSidebarActiveLink() {
    if (!appSidebar) return;
    var currentHash = (location.hash || '#home').replace(/^#/, '');
    appSidebar.querySelectorAll('a.o-sidebar-link').forEach(function (a) {
      var linkHash = (a.getAttribute('href') || '').replace(/^#/, '');
      var isActive = linkHash && linkHash !== '' && linkHash === currentHash;
      a.classList.toggle('o-sidebar-link--active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      if (isActive) {
        var category = a.closest('.o-sidebar-category');
        if (category && category.classList.contains('o-sidebar-category--folded')) {
          category.classList.remove('o-sidebar-category--folded');
          var head = category.querySelector('.o-sidebar-category-head');
          if (head) head.setAttribute('aria-expanded', 'true');
          category.setAttribute('data-expanded', 'true');
          var folds = _getSidebarFolds();
          var menuId = category.getAttribute('data-menu-id');
          if (menuId) { folds[menuId] = false; _setSidebarFolds(folds); }
        }
        var subgroup = a.closest('.o-sidebar-subgroup');
        if (subgroup && subgroup.classList.contains('o-sidebar-subgroup--folded')) {
          subgroup.classList.remove('o-sidebar-subgroup--folded');
          var subHead = subgroup.querySelector('.o-sidebar-subgroup-head');
          if (subHead) subHead.setAttribute('aria-expanded', 'true');
          var folds2 = _getSidebarFolds();
          var subId = subgroup.getAttribute('data-menu-id');
          if (subId) { folds2[subId] = false; _setSidebarFolds(folds2); }
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar wiring                                                     */
  /* ------------------------------------------------------------------ */

  function wireSidebarAfterRender() {
    if (!appSidebar || !appShell) return;
    var sidebar = appSidebar;
    var shell = appShell;

    sidebar.querySelectorAll('.o-sidebar-category-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = btn.closest('.o-sidebar-category');
        if (!sec || sec.classList.contains('o-sidebar-category--flat')) return;
        sec.classList.toggle('o-sidebar-category--folded');
        var folded = sec.classList.contains('o-sidebar-category--folded');
        btn.setAttribute('aria-expanded', folded ? 'false' : 'true');
        sec.setAttribute('data-expanded', folded ? 'false' : 'true');
        var folds = _getSidebarFolds();
        var menuId = sec.getAttribute('data-menu-id');
        if (menuId) { folds[menuId] = folded; _setSidebarFolds(folds); }
      });
    });

    sidebar.querySelectorAll('.o-sidebar-subgroup-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grp = btn.closest('.o-sidebar-subgroup');
        if (!grp) return;
        grp.classList.toggle('o-sidebar-subgroup--folded');
        var folded = grp.classList.contains('o-sidebar-subgroup--folded');
        btn.setAttribute('aria-expanded', folded ? 'false' : 'true');
        var folds = _getSidebarFolds();
        var menuId = grp.getAttribute('data-menu-id');
        if (menuId) { folds[menuId] = folded; _setSidebarFolds(folds); }
      });
    });

    sidebar.querySelectorAll('a.o-sidebar-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= 1023) closeMobileSidebar();
        var menuId = a.getAttribute('data-menu-id');
        if (!menuId || !viewsSvc) return;
        var menus = viewsSvc.getMenus() || [];
        var m = null;
        for (var mi = 0; mi < menus.length; mi++) {
          if (String((menus[mi].id || menus[mi].name || '')) === String(menuId)) {
            m = menus[mi];
            break;
          }
        }
        if (!m) return;
        var act = m.action ? viewsSvc.getAction(m.action) : null;
        var r = act ? actionToRoute(act) : menuToRoute(m);
        var href = (a.getAttribute('href') || '').replace(/^#/, '');
        if (r && href && href !== r) return;
        if (navigateActWindowIfAvailable(act, r, { source: 'sidebar', menuId: String(menuId) })) {
          e.preventDefault();
        }
      });
    });

    var bd = document.getElementById('o-sidebar-backdrop');
    if (bd) {
      bd.addEventListener('click', closeMobileSidebar);
    }

    var deskToggle = navbar && navbar.querySelector('.nav-sidebar-toggle');
    if (deskToggle) {
      var collapsed = typeof localStorage !== 'undefined' && localStorage.getItem('erp_sidebar_collapsed') === '1';
      if (collapsed) {
        shell.classList.add('o-app-shell--sidebar-collapsed');
        deskToggle.setAttribute('aria-expanded', 'false');
        deskToggle.innerHTML = '&#9654;';
        deskToggle.setAttribute('title', 'Expand menu');
      }
      deskToggle.addEventListener('click', function () {
        shell.classList.toggle('o-app-shell--sidebar-collapsed');
        var c = shell.classList.contains('o-app-shell--sidebar-collapsed');
        if (typeof localStorage !== 'undefined') localStorage.setItem('erp_sidebar_collapsed', c ? '1' : '0');
        deskToggle.setAttribute('aria-expanded', c ? 'false' : 'true');
        deskToggle.innerHTML = c ? '&#9654;' : '&#9664;';
        deskToggle.setAttribute('title', c ? 'Expand menu' : 'Collapse menu');
      });
    }

    var ham = navbar && navbar.querySelector('.nav-hamburger');
    if (ham) {
      ham.addEventListener('click', function () {
        if (window.innerWidth <= 1023) {
          var open = !shell.classList.contains('o-app-shell--sidebar-mobile-open');
          shell.classList.toggle('o-app-shell--sidebar-mobile-open', open);
          if (bd) {
            bd.hidden = !open;
            bd.setAttribute('aria-hidden', open ? 'false' : 'true');
          }
        }
      });
    }

    window.addEventListener('hashchange', function () {
      if (window.innerWidth <= 1023) closeMobileSidebar();
      _updateSidebarActiveLink();
    });

    if (!window._erpNavEscapeBound) {
      window._erpNavEscapeBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (appShell && appShell.classList.contains('o-app-shell--sidebar-mobile-open')) closeMobileSidebar();
      });
    }

    _updateSidebarActiveLink();
  }

  /* ------------------------------------------------------------------ */
  /*  Discuss                                                            */
  /* ------------------------------------------------------------------ */

  function renderDiscuss(channelId) {
    var dmod = window.AppCore && window.AppCore.DiscussViewModule;
    if (dmod && typeof dmod.render === 'function') {
      var ok = dmod.render(main, {
        channelId: channelId,
        rpc: rpc,
        showToast: showToast,
        bus: window.Services && window.Services.bus,
        session: window.Services && window.Services.session,
      });
      if (ok) {
        setActionStack([]);
        return;
      }
    }
    if (DiscussViewCore && typeof DiscussViewCore.render === 'function') {
      var coreHandled = DiscussViewCore.render(main, {
        channelId: channelId,
        rpc: rpc,
        showToast: showToast,
      });
      if (coreHandled) return;
    }
    renderDiscussFallback(channelId);
  }

  function renderDiscussFallback(channelId) {
    setActionStack([]);
    var container = document.createElement('div');
    container.id = 'discuss-container';
    container.className = 'o-discuss-layout';
    main.innerHTML = '';
    main.appendChild(container);

    var sidebarEl = document.createElement('div');
    sidebarEl.className = 'o-discuss-sidebar';
    var msgArea = document.createElement('div');
    msgArea.className = 'o-discuss-main';
    container.appendChild(sidebarEl);
    container.appendChild(msgArea);

    sidebarEl.innerHTML =
      '<h3 class="o-discuss-section-title">Channels</h3>' +
      '<button type="button" id="discuss-new-channel" class="o-discuss-btn-primary">New Channel</button>' +
      '<div id="discuss-channel-list"></div>';

    msgArea.innerHTML =
      '<div id="discuss-messages" class="o-discuss-messages"></div>' +
      '<div id="discuss-compose" class="o-discuss-compose">' +
      '<textarea id="discuss-body" rows="2" class="o-discuss-textarea"></textarea>' +
      '<button type="button" id="discuss-post-btn" class="o-discuss-send-btn">Send</button>' +
      '</div>';

    fetch('/discuss/channel/list', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (channels) {
        var listEl = document.getElementById('discuss-channel-list');
        if (!listEl) return;
        if (!channels || !channels.length) {
          listEl.innerHTML = '<p class="o-discuss-muted">No channels. Create one.</p>';
          return;
        }
        listEl.innerHTML = channels.map(function (c) {
          var active = channelId && c.id === parseInt(channelId, 10)
            ? ' discuss-channel-link--active' : '';
          return '<a href="#discuss/' + c.id + '" class="discuss-channel-link' + active + '" data-id="' + c.id + '">' +
            (c.name || '').replace(/</g, '&lt;') + '</a>';
        }).join('');

        if (channelId) {
          var compose = document.getElementById('discuss-compose');
          if (compose) compose.classList.add('o-discuss-compose--visible');
          fetch('/discuss/channel/' + channelId + '/messages', { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (msgs) {
              var msgEl = document.getElementById('discuss-messages');
              if (!msgEl) return;
              if (!msgs || !msgs.length) {
                msgEl.innerHTML = '<p class="o-discuss-muted">No messages yet.</p>';
                return;
              }
              msgEl.innerHTML = msgs.map(function (m) {
                var body = (m.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
                var date = (m.date || '').substring(0, 19).replace('T', ' ');
                return '<div class="o-discuss-msg-row">' +
                  '<span class="o-discuss-msg-meta">' + date + '</span><br>' + body + '</div>';
              }).join('');
            })
            .catch(function () {
              var msgEl = document.getElementById('discuss-messages');
              if (msgEl) msgEl.innerHTML = '<p class="o-discuss-muted">Could not load messages.</p>';
            });
        } else {
          var msgEl = document.getElementById('discuss-messages');
          if (msgEl) msgEl.innerHTML = '<p class="o-discuss-muted">Select a channel.</p>';
        }
      })
      .catch(function () {
        var listEl = document.getElementById('discuss-channel-list');
        if (listEl) listEl.innerHTML = '<p class="o-discuss-muted">Could not load channels.</p>';
      });

    document.getElementById('discuss-new-channel').onclick = function () {
      var name = prompt('Channel name:');
      if (!name || !name.trim()) return;
      var hdrs = { 'Content-Type': 'application/json' };
      if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
        Object.assign(hdrs, window.Services.session.getAuthHeaders());
      }
      fetch('/discuss/channel/create', {
        method: 'POST',
        credentials: 'include',
        headers: hdrs,
        body: JSON.stringify({ name: name.trim(), channel_type: 'channel' })
      }).then(function (r) { return r.json(); }).then(function (ch) {
        if (ch.error) { showToast(ch.error, 'error'); return; }
        window.location.hash = 'discuss/' + (ch.id || ch);
      }).catch(function () { showToast('Failed to create channel', 'error'); });
    };

    if (channelId) {
      document.getElementById('discuss-post-btn').onclick = function () {
        var body = document.getElementById('discuss-body').value.trim();
        if (!body) return;
        var postHdrs = { 'Content-Type': 'application/json' };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
          Object.assign(postHdrs, window.Services.session.getAuthHeaders());
        }
        fetch('/discuss/channel/' + channelId + '/post', {
          method: 'POST',
          credentials: 'include',
          headers: postHdrs,
          body: JSON.stringify({ body: body })
        }).then(function (r) { return r.json(); }).then(function (msg) {
          if (msg.error) { showToast(msg.error, 'error'); return; }
          document.getElementById('discuss-body').value = '';
          var msgEl = document.getElementById('discuss-messages');
          var div = document.createElement('div');
          div.className = 'o-discuss-msg-row';
          div.innerHTML = '<span class="o-discuss-msg-meta">' +
            (msg.date || '').substring(0, 19).replace('T', ' ') + '</span><br>' +
            (msg.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
          msgEl.appendChild(div);
        }).catch(function () { showToast('Failed to post', 'error'); });
      };
    }

    if (window.Services && window.Services.bus) {
      var chs = [];
      (window.Services.session && window.Services.session.getSessionInfo
        ? window.Services.session.getSessionInfo()
        : Promise.resolve({ uid: 1 })
      ).then(function (info) {
        chs.push('res.partner_' + ((info && info.uid) || 1));
        if (channelId) chs.push('mail.channel_' + channelId);
        window.Services.bus.setChannels(chs);
        window.Services.bus.start(chs);
      });
    }

    if (window._discussBusListener) window.removeEventListener('bus:message', window._discussBusListener);
    window._discussBusListener = function (e) {
      var d = e.detail || {};
      var msg = d.message || {};
      if (msg.type === 'message' && msg.res_model === 'mail.channel' && msg.res_id == channelId) {
        var msgEl = document.getElementById('discuss-messages');
        if (!msgEl) return;
        var div = document.createElement('div');
        div.className = 'o-discuss-msg-row';
        div.innerHTML = '<span class="o-discuss-msg-meta">' +
          (new Date().toISOString().substring(0, 19).replace('T', ' ')) + '</span><br>' +
          (msg.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
        msgEl.appendChild(div);
      }
    };
    window.addEventListener('bus:message', window._discussBusListener);
  }

  /* ------------------------------------------------------------------ */
  /*  Home                                                               */
  /* ------------------------------------------------------------------ */

  function renderHome() {
    if (typeof window !== 'undefined') window.chatContext = {};
    setActionStack([]);
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var storedAppId = typeof localStorage !== 'undefined' ? (localStorage.getItem('erp_sidebar_app') || '') : '';

    main.innerHTML = '';
    var root = document.createElement('section');
    root.className = 'o-home-apps';

    var header = document.createElement('header');
    header.className = 'o-home-apps-header';
    header.innerHTML = '<h2 class="o-home-apps-title">Apps</h2><p class="o-home-apps-subtitle">Choose a module to start working.</p>';
    root.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'o-app-grid';
    if (!appRoots.length) {
      grid.innerHTML = '<p class="o-app-grid-empty">No apps available.</p>';
    } else {
      appRoots.forEach(function (node) {
        var menu = node.menu || {};
        var appId = menu.id || '';
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'o-app-tile o-card-gradient';
        if (String(appId) === String(storedAppId)) tile.className += ' o-app-tile--active';
        var icon = _sidebarIconHtml(menu);
        var defaultRoute = getDefaultRouteForAppNode(node) || 'home';
        tile.innerHTML =
          '<span class="o-app-tile-icon-wrap">' + icon + '</span>' +
          '<span class="o-app-tile-name">' + escNavHtml(menu.name || 'App') + '</span>' +
          '<span class="o-app-tile-route">' + escNavHtml(defaultRoute) + '</span>';
        tile.addEventListener('click', function () {
          selectApp(appId);
        });
        grid.appendChild(tile);
      });
    }
    root.appendChild(grid);

    var kpiStrip = document.createElement('div');
    kpiStrip.className = 'o-home-kpi-strip-outer';
    if (window.AppCore && window.AppCore.DashboardKpiStrip && typeof window.AppCore.DashboardKpiStrip.buildHtml === 'function') {
      kpiStrip.innerHTML = window.AppCore.DashboardKpiStrip.buildHtml();
    }
    root.appendChild(kpiStrip);
    if (window.AppCore && window.AppCore.DashboardKpiStrip && typeof window.AppCore.DashboardKpiStrip.wireHomeKpiStrip === 'function') {
      window.AppCore.DashboardKpiStrip.wireHomeKpiStrip(kpiStrip, rpc);
    }

    if (window.UIComponents && window.UIComponents.OnboardingPanel && typeof window.UIComponents.OnboardingPanel.renderHTML === 'function') {
      var onboardingWrap = document.createElement('div');
      onboardingWrap.innerHTML = window.UIComponents.OnboardingPanel.renderHTML({
        storageKey: 'home',
        steps: [
          { title: 'Configure company', description: 'Set company profile and defaults.', actionLabel: 'Open settings', done: false },
          { title: 'Import data', description: 'Load customers and products.', actionLabel: 'Open import', done: false },
          { title: 'Create first record', description: 'Start with a lead, task, or invoice.', actionLabel: 'Open CRM', done: false },
        ],
      });
      root.appendChild(onboardingWrap);
      window.UIComponents.OnboardingPanel.wire(onboardingWrap, {
        onStepAction: function (idx) {
          if (idx === 0) window.location.hash = 'settings';
          if (idx === 1) window.location.hash = 'contacts';
          if (idx === 2) window.location.hash = 'pipeline';
        },
      });
    }

    var dashboardWrap = document.createElement('section');
    dashboardWrap.className = 'o-home-dashboard-wrap';
    root.appendChild(dashboardWrap);
    main.appendChild(root);

    if (DashboardCore && typeof DashboardCore.render === 'function') {
      DashboardCore.render(dashboardWrap, { rpc: rpc });
      return;
    }
    dashboardWrap.innerHTML = '<p class="o-dashboard-fallback">Dashboard module not loaded.</p>';
  }

  /* ------------------------------------------------------------------ */
  /*  Dashboard / Settings                                               */
  /* ------------------------------------------------------------------ */

  function renderDashboard() {
    setActionStack([]);
    if (DashboardCore && typeof DashboardCore.render === 'function') {
      DashboardCore.render(main, { rpc: rpc });
      return;
    }
    main.innerHTML = '<p class="o-dashboard-fallback">Dashboard module not loaded.</p>';
  }

  function renderSettings() {
    setActionStack([{ label: 'Settings', hash: 'settings' }]);
    if (SettingsCore && typeof SettingsCore.renderIndex === 'function') {
      SettingsCore.renderIndex(main, {
        rpc: rpc,
        showToast: showToast,
        reloadIndex: function () { renderSettings(); },
      });
      return;
    }
    main.innerHTML = '<p class="o-settings-fallback">Settings module not loaded.</p>';
  }

  function renderDashboardWidgets() {
    setActionStack([
      { label: 'Settings', hash: 'settings' },
      { label: 'Dashboard Widgets', hash: 'settings/dashboard-widgets' },
    ]);
    if (SettingsCore && typeof SettingsCore.renderDashboardWidgets === 'function') {
      SettingsCore.renderDashboardWidgets(main, {
        rpc: rpc,
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadDashboardWidgets: function () { renderDashboardWidgets(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  function renderApiKeysSettings() {
    setActionStack([
      { label: 'Settings', hash: 'settings' },
      { label: 'API Keys', hash: 'settings/apikeys' },
    ]);
    if (SettingsCore && typeof SettingsCore.renderApiKeys === 'function') {
      SettingsCore.renderApiKeys(main, {
        rpc: rpc,
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadApiKeys: function () { renderApiKeysSettings(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  function renderTotpSettings() {
    setActionStack([
      { label: 'Settings', hash: 'settings' },
      { label: 'Two-Factor Authentication', hash: 'settings/totp' },
    ]);
    if (SettingsCore && typeof SettingsCore.renderTotp === 'function') {
      SettingsCore.renderTotp(main, {
        showToast: showToast,
        breadcrumbsHtml: renderBreadcrumbs(),
        reloadTotp: function () { renderTotpSettings(); },
      });
      attachBreadcrumbHandlers();
      return;
    }
    main.innerHTML = renderBreadcrumbs() + '<p class="o-settings-fallback">Settings module not loaded.</p>';
    attachBreadcrumbHandlers();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  SR.buildMenuTree = buildMenuTree;
  SR.getAppRoots = getAppRoots;
  SR.getAppIdForRoute = getAppIdForRoute;
  SR.getDefaultNavFromAppNode = getDefaultNavFromAppNode;
  SR.getDefaultRouteForAppNode = getDefaultRouteForAppNode;
  SR.selectApp = selectApp;

  SR.escNavHtml = escNavHtml;
  SR.sidebarAbbrev = sidebarAbbrev;
  SR._getSidebarFolds = _getSidebarFolds;
  SR._setSidebarFolds = _setSidebarFolds;
  SR._sidebarIconHtml = _sidebarIconHtml;
  SR._renderSidebarChildren = _renderSidebarChildren;
  SR.buildSidebarNavHtml = buildSidebarNavHtml;
  SR.closeMobileSidebar = closeMobileSidebar;
  SR._updateSidebarActiveLink = _updateSidebarActiveLink;
  SR.wireSidebarAfterRender = wireSidebarAfterRender;

  SR.renderDiscuss = renderDiscuss;
  SR.renderDiscussFallback = renderDiscussFallback;
  SR.renderHome = renderHome;
  SR.renderDashboard = renderDashboard;
  SR.renderSettings = renderSettings;
  SR.renderDashboardWidgets = renderDashboardWidgets;
  SR.renderApiKeysSettings = renderApiKeysSettings;
  SR.renderTotpSettings = renderTotpSettings;

  // ── Route title map (Phase 1.250.17 — extracted from main.js) ─────────────
  var _TITLE_MAP = {
    "contacts": "Contacts", "pipeline": "Pipeline", "crm/activities": "CRM Activities",
    "leads": "Leads", "orders": "Orders", "products": "Products",
    "attachments": "Attachments", "settings/users": "Users",
    "settings/approval_rules": "Approval Rules", "settings/approval_requests": "Approval Requests",
    "marketing/mailing_lists": "Mailing Lists", "marketing/mailings": "Mailings",
    "articles": "Articles", "knowledge_categories": "Categories",
    "leaves": "Leaves", "leave_types": "Leave Types", "allocations": "Allocations",
    "cron": "Scheduled Actions", "server_actions": "Server Actions", "sequences": "Sequences",
    "manufacturing": "Manufacturing Orders", "boms": "Bills of Materials",
    "workcenters": "Work Centers", "transfers": "Transfers", "warehouses": "Warehouses",
    "purchase_orders": "Purchase Orders", "invoices": "Invoices",
    "bank_statements": "Bank Statements", "journals": "Journals",
    "accounts": "Chart of Accounts", "employees": "Employees",
    "departments": "Departments", "jobs": "Job Positions", "attendances": "Attendances",
    "recruitment": "Recruitment", "time_off": "Time Off", "expenses": "Expenses",
    "projects": "Projects", "repair_orders": "Repairs", "surveys": "Surveys",
    "lunch_orders": "Lunch", "livechat_channels": "Live Chat", "project_todos": "To-Do",
    "recycle_models": "Data Recycle", "skills": "Skills", "elearning": "eLearning",
    "timesheets": "Timesheets", "tickets": "Tickets", "crm_stages": "CRM Stages",
    "crm_tags": "CRM Tags", "crm_lost_reasons": "Lost Reasons", "meetings": "Calendar",
    "pos_orders": "Point of Sale Orders", "pos_sessions": "POS Sessions",
  };

  SR.getTitle = function (route) {
    if (_TITLE_MAP[route]) return _TITLE_MAP[route];
    return route ? (route.charAt(0).toUpperCase() + route.slice(1)) : "Records";
  };
})();
