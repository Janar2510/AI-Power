/**
 * ERP Platform Web Client - Data-driven menus, actions, list/form views
 */
(function () {
  const frontendBootstrap = window.__erpFrontendBootstrap || {};
  const modernShellOwner = frontendBootstrap.runtime === "modern";
  const main = document.getElementById('action-manager');
  const navbar = document.getElementById('navbar');
  const appShell = document.getElementById('webclient');
  const appSidebar = document.getElementById('app-sidebar');
  if (!main) return;

  function showToast(message, type) {
    type = type || 'info';
    if (window.UIComponents && typeof window.UIComponents.Toast === "function") {
      window.UIComponents.Toast({ message: message || "", type: type });
      return;
    }
    const container = document.getElementById('toast-container');
    if (!container) return;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<span>' + (message || '').replace(/</g, '&lt;') + '</span><button type="button" class="toast-close" aria-label="Close">&times;</button>';
    container.appendChild(el);
    const dismiss = function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      setTimeout(function () { el.remove(); }, 200);
    };
    el.querySelector('.toast-close').onclick = dismiss;
    setTimeout(dismiss, 4000);
  }

  function skeletonHtml(lines, shortLast) {
    if (HelpersCore && typeof HelpersCore.renderSkeletonHtml === "function") {
      return HelpersCore.renderSkeletonHtml(lines, shortLast);
    }
    return '<p class="o-skeleton-msg">Loading...</p>';
  }

  const rpc = window.Services && window.Services.rpc ? window.Services.rpc : (window.Session || { callKw: () => Promise.reject(new Error('RPC not loaded')) });
  const viewsSvc = window.Services && window.Services.views ? window.Services.views : null;
  const RouterCore = window.AppCore && window.AppCore.Router ? window.AppCore.Router : null;
  const ViewManagerCore = window.AppCore && window.AppCore.ViewManager ? window.AppCore.ViewManager : null;
  const DashboardCore = window.AppCore && window.AppCore.Dashboard ? window.AppCore.Dashboard : null;
  const SettingsCore = window.AppCore && window.AppCore.Settings ? window.AppCore.Settings : null;
  const ListViewCore = window.AppCore && window.AppCore.ListView ? window.AppCore.ListView : null;
  const FormViewCore = window.AppCore && window.AppCore.FormView ? window.AppCore.FormView : null;
  const NavbarCore = window.AppCore && window.AppCore.Navbar ? window.AppCore.Navbar : null;
  const SidebarCore = window.AppCore && window.AppCore.Sidebar ? window.AppCore.Sidebar : null;
  const DiscussViewCore = window.AppCore && window.AppCore.DiscussView ? window.AppCore.DiscussView : null;
  const GraphViewCore = window.AppCore && window.AppCore.GraphView ? window.AppCore.GraphView : null;
  const PivotViewCore = window.AppCore && window.AppCore.PivotView ? window.AppCore.PivotView : null;
  const CalendarViewCore = window.AppCore && window.AppCore.CalendarView ? window.AppCore.CalendarView : null;
  const GanttViewCore = window.AppCore && window.AppCore.GanttView ? window.AppCore.GanttView : null;
  const ActivityViewCore = window.AppCore && window.AppCore.ActivityView ? window.AppCore.ActivityView : null;
  const ImportCore = window.AppCore && window.AppCore.Import ? window.AppCore.Import : null;
  const ChatterCore = window.AppCore && window.AppCore.Chatter ? window.AppCore.Chatter : null;
  const FieldUtilsCore = window.AppCore && window.AppCore.FieldUtils ? window.AppCore.FieldUtils : null;
  const HelpersCore = window.AppCore && window.AppCore.Helpers ? window.AppCore.Helpers : null;
  const SystraySvc = window.Services && window.Services.systray ? window.Services.systray : null;

  var actionStack = [];
  var formDirty = false;
  var lastHash = (window.location.hash || '#home').slice(1);
  var navContext = { userCompanies: null, userLangs: [], currentLang: 'en_US' };
  if (window.Services && window.Services.commandPalette && typeof window.Services.commandPalette.initHotkey === "function") {
    window.Services.commandPalette.initHotkey();
  }
  if (window.Services && window.Services.pwa && typeof window.Services.pwa.register === "function") {
    window.Services.pwa.register();
  }


  var FV = window.__ERP_FORM_VIEWS || {};
  var LV = window.__ERP_LIST_VIEWS || {};
  var CV = window.__ERP_CHART_VIEWS || {};
  var SR = window.__ERP_SHELL_ROUTES || {};

  function pushBreadcrumb(label, hash) {
    actionStack.push({ label: label, hash: hash });
    if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
      window.ActionManager.saveToStorage(actionStack);
    }
  }

  function popBreadcrumbTo(index) {
    if (index < actionStack.length) {
      actionStack = actionStack.slice(0, index + 1);
      if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
        window.ActionManager.saveToStorage(actionStack);
      }
      var entry = actionStack[actionStack.length - 1];
      if (entry) {
        var h = entry.hash;
        if (window.ActionManager && actionStack.length > 1 && typeof window.ActionManager.syncHashWithStack === 'function') {
          h = window.ActionManager.syncHashWithStack(h, actionStack);
        }
        window.location.hash = h;
      }
    }
  }

  function renderBreadcrumbs() {
    var BS = window.AppCore && window.AppCore.BreadcrumbStrip;
    if (BS && typeof BS.buildBreadcrumbsHtml === 'function') {
      return BS.buildBreadcrumbsHtml(actionStack || []);
    }
    if (window.UIComponents && window.UIComponents.Breadcrumbs && typeof window.UIComponents.Breadcrumbs.renderHTML === "function") {
      return window.UIComponents.Breadcrumbs.renderHTML(actionStack || []);
    }
    if (actionStack.length <= 1) return '';
    var html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
    actionStack.forEach(function (entry, i) {
      if (i === actionStack.length - 1) {
        html += '<span class="breadcrumb-item active">' + (entry.label || '').replace(/</g, '&lt;') + '</span>';
      } else {
        html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + i + '">' + (entry.label || '').replace(/</g, '&lt;') + '</a>';
        html += '<span class="breadcrumb-sep">/</span>';
      }
    });
    html += '</nav>';
    return html;
  }

  function attachBreadcrumbHandlers() {
    main.querySelectorAll('[data-bc-idx]').forEach(function (el) {
      el.onclick = function () {
        popBreadcrumbTo(parseInt(el.getAttribute('data-bc-idx'), 10));
      };
    });
  }

  /**
   * Phase 681: append breadcrumb when list opens from menu chrome (sidebar / app picker / navigateFromMenu).
   * Cleared on read. Other entry points leave it null → single-crumb reset in renderList.
   */
  /** Phase 694: persist multi-crumb stack in hash (?stack=) for reload/share; pairs with ActionManager.decodeStackFromHash (670). */
  function syncHashWithActionStackIfMulti(route) {
    if (typeof window === 'undefined' || !actionStack || actionStack.length <= 1) return;
    if (!window.ActionManager || typeof window.ActionManager.syncHashWithStack !== 'function') return;
    var cur = window.location.hash.slice(1);
    var routeBase = String(route || '').split('?')[0];
    var curBase = cur.split('?')[0];
    var baseWithQuery = curBase === routeBase ? cur : String(route || '');
    var next = window.ActionManager.syncHashWithStack(baseWithQuery, actionStack);
    if (!next || next === cur) return;
    window.location.replace('#' + next);
  }

  function applyActionStackForList(route, title) {
    var hashFull = typeof window !== 'undefined' ? String(window.location.hash || '').replace(/^#/, '') : '';
    if (
      hashFull.indexOf('stack=') >= 0 &&
      window.ActionManager &&
      typeof window.ActionManager.decodeStackFromHash === 'function'
    ) {
      var decPreserve = window.ActionManager.decodeStackFromHash(hashFull);
      if (decPreserve && decPreserve.length > 1) {
        var brP = String(route || '').split('?')[0];
        var lastP = decPreserve[decPreserve.length - 1];
        var lbP = String(lastP && lastP.hash ? lastP.hash : '').split('?')[0];
        if (lbP === brP) {
          actionStack = decPreserve.slice();
          var leafP = actionStack[actionStack.length - 1];
          leafP.label = title;
          leafP.hash = route;
          if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
            window.ActionManager.saveToStorage(actionStack);
          }
          return;
        }
      }
    }
    var pending = typeof window !== 'undefined' ? window.__ERP_PENDING_LIST_NAV_SOURCE : null;
    if (typeof window !== 'undefined') {
      window.__ERP_PENDING_LIST_NAV_SOURCE = null;
    }
    var appendChrome = pending === 'sidebar' || pending === 'selectApp' || pending === 'navigateFromMenu';
    var baseRoute = String(route || '').split('?')[0];
    if (appendChrome && actionStack.length > 0) {
      var last = actionStack[actionStack.length - 1];
      var lastBase = String(last.hash || '').split('?')[0];
      if (lastBase === baseRoute) {
        last.label = title;
        if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
          window.ActionManager.saveToStorage(actionStack);
        }
        syncHashWithActionStackIfMulti(route);
        return;
      }
      actionStack = actionStack.concat([{ label: title, hash: route }]);
      if (window.ActionManager && typeof window.ActionManager.saveToStorage === 'function') {
        window.ActionManager.saveToStorage(actionStack);
      }
      syncHashWithActionStackIfMulti(route);
      return;
    }
    actionStack = [{ label: title, hash: route }];
  }

  var RL = window.__ERP_ROUTE_LEGACY || {};
  var DATA_ROUTES_SLUGS = RL.DATA_ROUTES_SLUGS || '';
  function actionToRoute(action) {
    return RL.actionToRoute ? RL.actionToRoute(action) : null;
  }
  function menuToRoute(m) {
    return RL.menuToRoute ? RL.menuToRoute(m) : null;
  }
  function _warnSidebarMenuDisabled(menu, actionRef, hasResolvedAction, route) {
    if (RL._warnSidebarMenuDisabled) RL._warnSidebarMenuDisabled(menu, actionRef, hasResolvedAction, route);
  }
  function getActionForRoute(route) {
    return RL.getActionForRoute ? RL.getActionForRoute(route) : null;
  }
  function getModelForRoute(route) {
    return RL.getModelForRoute ? RL.getModelForRoute(route) : null;
  }
  if (typeof window !== 'undefined') {
    window.__ERP_getModelForRoute = getModelForRoute;
  }

  var PU = window.__ERP_PARSE_UTILS || {};
  function parseActionDomain(s) {
    return PU.parseActionDomain ? PU.parseActionDomain(s) : [];
  }
  function parseFilterDomain(s, uid) {
    return PU.parseFilterDomain ? PU.parseFilterDomain(s, uid) : [];
  }
  function parseCSV(text) {
    return PU.parseCSV ? PU.parseCSV(text) : [];
  }

  /**
   * Optional `domain=` query on the hash (JSON domain list); used by list loadRecords override.
   * @param {string} [fullHashSlice] — hash without leading `#` (e.g. routeApplyInternal’s `hash`); defaults to current location.
   */
  function parseDomainFromRouteHash(fullHashSlice) {
    var h = fullHashSlice != null ? String(fullHashSlice) : (window.location.hash || '').slice(1);
    var q = h.indexOf('?');
    if (q < 0) return [];
    var params = new URLSearchParams(h.slice(q + 1));
    var raw = params.get('domain');
    if (!raw) return [];
    var parsed = parseActionDomain(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [];
  }

  function getHashDomainParam() {
    return parseDomainFromRouteHash(null);
  }

  // Global fallbacks for stale web.bundle.js / tooling splits that call getHashDomainParam out of scope.
  window.__ERP_parseDomainFromRouteHash = parseDomainFromRouteHash;
  window.__ERP_getHashDomainParam = getHashDomainParam;

  var CHROME = window.__ERP_CHROME_BLOCK || {};
  function showImportModal(model, route) {
    if (CHROME.showImportModal) return CHROME.showImportModal(model, route);
  }



  function buildMenuTree(menus) { return SR.buildMenuTree ? SR.buildMenuTree(menus) : []; }
  function getAppRoots(tree, menus) { return SR.getAppRoots ? SR.getAppRoots(tree, menus) : []; }
  function getAppIdForRoute(route, menus) { return SR.getAppIdForRoute ? SR.getAppIdForRoute(route, menus) : null; }

  /**
   * Phase 648: Prefer env.services.action via ViewManager.openFromActWindow for act_window navigation
   * (sidebar, app picker) instead of only assigning location.hash.
   */
  function navigateActWindowIfAvailable(action, targetRoute, options) {
    var opt = options || {};
    if (typeof window !== 'undefined' && (opt.source === 'sidebar' || opt.source === 'selectApp')) {
      window.__ERP_PENDING_LIST_NAV_SOURCE = opt.source;
    }
    var slug = targetRoute || 'home';
    var nextHash = '#' + slug;
    var VM = window.AppCore && window.AppCore.ViewManager;
    /** Ensure hash + legacy route() run even if modular doAction skipped navigation (actionToRoute null, etc.). */
    function syncHashAfterOpenFromActWindow() {
      renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
      var wantRaw = String(slug || 'home');
      var wantBase = wantRaw.split('?')[0];
      var curRaw = (window.location.hash || '#home').replace(/^#/, '') || 'home';
      var curBase = curRaw.split('?')[0];
      if (curBase !== wantBase) {
        window.location.hash = '#' + wantRaw;
      } else {
        route();
      }
    }
    if (VM && typeof VM.openFromActWindow === 'function' && action) {
      if (window.location.hash === nextHash) {
        renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
        route();
        return true;
      }
      var p = VM.openFromActWindow(action, opt);
      /** Post-1.249 Phase A: one-shot sync + deadline so hung loadViews cannot strand #action-manager. */
      var syncDone = false;
      var navSyncTimer = null;
      function syncOnce() {
        if (syncDone) return;
        syncDone = true;
        if (navSyncTimer != null) clearTimeout(navSyncTimer);
        syncHashAfterOpenFromActWindow();
      }
      navSyncTimer = setTimeout(syncOnce, 6000);
      if (p && typeof p.then === 'function') {
        p.then(syncOnce).catch(syncOnce);
      } else {
        syncOnce();
      }
      return true;
    }
    return false;
  }

  // ─── Track O2: Route-to-OWL bridge ────────────────────────────────────────
  /**
   * Try to route a list/form/kanban path through the OWL ActionContainer via
   * ActionBus instead of legacy string-HTML builders.
   *
   * Returns true when the OWL path was taken so the caller can skip legacy rendering.
   * Falls back gracefully when viewRegistry has no OWL controller for the type.
   */
  function _tryOwlRoute(viewType, model, resId, extraProps) {
    var AB = window.AppCore && window.AppCore.ActionBus;
    if (!AB || typeof AB.trigger !== 'function') return false;
    // Default shell: cspScriptEvalBlocked true → OWL templates cannot compile; never skip legacy renderers.
    var _fb = typeof window !== 'undefined' && window.__erpFrontendBootstrap;
    if (!_fb || _fb.cspScriptEvalBlocked !== false) return false;
    // Post-1.248: OWL path only when ActionContainer is mounted (not just #action-manager placeholder)
    if (!window.__ERP_OWL_ACTION_CONTAINER_MOUNTED) return false;
    var mountEl = document.getElementById('action-manager');
    if (!mountEl) return false;
    // CSP fallback shell: no real OWL views — always use legacy list/form renderers.
    if (
      mountEl.matches("[data-erp-owl-fallback]") ||
      mountEl.querySelector("[data-erp-owl-fallback]")
    ) {
      return false;
    }
    // Check viewRegistry has a controller
    var vr = window.AppCore && window.AppCore.viewRegistry;
    var desc = vr && typeof vr.get === 'function' && vr.get(viewType);
    if (!desc) return false;
    AB.trigger('ACTION_MANAGER:UPDATE', Object.assign({
      viewType: viewType,
      resModel: model,
      resId: resId || null,
    }, extraProps ? { props: extraProps } : {}));
    return true;
  }

  /**
   * Phase 658: List routes from hash / deep links dispatch act_window through ViewManager → action service.
   * No same-hash → route() branch (avoids re-entrancy when called from routeApplyInternal).
   */
  function dispatchActWindowForListRoute(route, options) {
    if (!route) return;
    var VM = window.AppCore && window.AppCore.ViewManager;
    if (VM && typeof VM.syncListRouteFromMain === 'function') {
      VM.syncListRouteFromMain(route, getActionForRoute, options || { source: 'routeApplyList' });
      return;
    }
    var action = getActionForRoute(route);
    if (!action) return;
    if (VM && typeof VM.openFromActWindow === 'function') {
      VM.openFromActWindow(action, options || { source: 'routeApplyList' });
    }
  }

  /** Phase 668: keep ViewManager / action stack aligned before list/kanban → form hash navigation (669: no pre-dispatch on bare form URLs from chrome). */
  function dispatchListActWindowThenFormHash(route, formSuffix, source) {
    dispatchActWindowForListRoute(route, { source: source || 'listOpenForm' });
    window.location.hash = route + '/' + formSuffix;
  }

  /** Phase 730 / 668: gantt, activity matrix, calendar — delegated edit links (same idea as listTableEditLink). */
  function attachActWindowFormLinkDelegation(rootSelector, route, source) {
    var root = main.querySelector(rootSelector);
    if (!root) return;
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.o-erp-actwindow-form-link');
      if (!a) return;
      var id = a.getAttribute('data-edit-id');
      if (!id) return;
      e.preventDefault();
      dispatchListActWindowThenFormHash(route, 'edit/' + id, source);
    });
  }


  function getDefaultNavFromAppNode(node) { return SR.getDefaultNavFromAppNode ? SR.getDefaultNavFromAppNode(node) : null; }
  function getDefaultRouteForAppNode(node) { return SR.getDefaultRouteForAppNode ? SR.getDefaultRouteForAppNode(node) : null; }
  function selectApp(appId) { if (SR.selectApp) SR.selectApp(appId); }
  function escNavHtml(s) { return SR.escNavHtml ? SR.escNavHtml(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function sidebarAbbrev(name) { return SR.sidebarAbbrev ? SR.sidebarAbbrev(name) : (String(name || '').trim().charAt(0).toUpperCase() || '\u2022'); }
  function _getSidebarFolds() { return SR._getSidebarFolds ? SR._getSidebarFolds() : {}; }
  function _setSidebarFolds(f) { if (SR._setSidebarFolds) SR._setSidebarFolds(f); }
  function _sidebarIconHtml(m) { return SR._sidebarIconHtml ? SR._sidebarIconHtml(m) : '<span class="o-sidebar-abbrev">' + escNavHtml(sidebarAbbrev(m.name)) + '</span>'; }
  function _renderSidebarChildren(ch, h, d) { return SR._renderSidebarChildren ? SR._renderSidebarChildren(ch, h, d) : ''; }
  function buildSidebarNavHtml(tree, stale) { return SR.buildSidebarNavHtml ? SR.buildSidebarNavHtml(tree, stale) : '<div class="o-sidebar-inner"></div>'; }
  function closeMobileSidebar() { if (SR.closeMobileSidebar) SR.closeMobileSidebar(); }
  function _updateSidebarActiveLink() { if (SR._updateSidebarActiveLink) SR._updateSidebarActiveLink(); }
  function wireSidebarAfterRender() { if (SR.wireSidebarAfterRender) SR.wireSidebarAfterRender(); }

  function renderSystrayMount() {
    if (!navbar) return;
    var host = navbar.querySelector(".o-systray-registry");
    if (!host || !SystraySvc) return;
    if (!SystraySvc.getItems().length) {
      SystraySvc.add("async_jobs", {
        sequence: 10,
        render: function () {
          return '<button type="button" class="nav-link o-systray-item" id="systray-async" title="Async jobs">Jobs <span class="o-systray-count" id="systray-async-count">0</span></button>';
        },
      });
      SystraySvc.add("shortcuts", {
        sequence: 20,
        render: function () {
          return '<button type="button" class="nav-link o-systray-item" id="systray-shortcuts" title="Keyboard shortcuts">?</button>';
        },
      });
    }
    host.innerHTML = SystraySvc.renderAll({});
    var asyncBtn = host.querySelector("#systray-async");
    if (asyncBtn) {
      asyncBtn.onclick = function () { window.location.hash = "settings"; };
      fetch("/web/async/call_notify", { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var c = host.querySelector("#systray-async-count");
          if (!c) return;
          var total = Number((data && data.pending) || 0) + Number((data && data.running) || 0) + Number((data && data.failed) || 0);
          c.textContent = String(total);
          c.style.display = total ? "inline-flex" : "none";
        })
        .catch(function () {});
    }
    var kbBtn = host.querySelector("#systray-shortcuts");
    if (kbBtn) {
      kbBtn.onclick = function () {
        showShortcutHelp();
      };
    }
    if (window.__erpNavbarFacade && typeof window.__erpNavbarFacade.markSystrayRendered === 'function') {
      window.__erpNavbarFacade.markSystrayRendered(host);
    }
  }

  function showShortcutHelp() {
    if (window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.openModal === "function") {
      window.UIComponents.ConfirmDialog.openModal({
        title: "Keyboard shortcuts",
        content:
          '<div class="o-shortcut-sheet">' +
          '<p><kbd>Mod+K</kbd> Command palette</p>' +
          '<p><kbd>Alt+N</kbd> New record</p>' +
          '<p><kbd>Alt+S</kbd> Save form</p>' +
          '<p><kbd>Alt+E</kbd> Toggle edit mode</p>' +
          '<p><kbd>Alt+L</kbd> List view</p>' +
          '<p><kbd>Alt+K</kbd> Kanban view</p>' +
          '<p><kbd>Alt+P</kbd> Print / preview</p>' +
          "<p><kbd>Esc</kbd> Close modal</p>" +
          "</div>",
      });
      return;
    }
    window.alert("Shortcuts: Mod+K, Alt+N, Alt+S, Alt+E, Alt+L, Alt+K, Alt+P, Esc");
  }

  function renderNavbar(userCompanies, userLangs, currentLang) {
    if (CHROME.renderNavbar) return CHROME.renderNavbar(userCompanies, userLangs, currentLang);
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    if (model === 'crm.lead') return ['name', 'type', 'stage_id', 'ai_score_label', 'date_deadline', 'expected_revenue', 'tag_ids'];
    if (model === 'sale.order') return ['name', 'partner_id', 'date_order', 'state', 'amount_total'];
    if (model === 'product.product') return ['name', 'list_price'];
    if (model === 'res.users') return ['name', 'login', 'active'];
    return ['name', 'is_company', 'email', 'phone', 'city', 'country_id', 'state_id'];
  }

  function getSearchFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'search');
      if (v && v.search_fields && v.search_fields.length) return v.search_fields;
    }
    return ['name'];
  }

  function getReportName(model) {
    if (viewsSvc && viewsSvc.getReportName) {
      const fromRegistry = viewsSvc.getReportName(model);
      if (fromRegistry) return fromRegistry;
    }
    const reportMap = {
      'crm.lead': 'crm.lead_summary',
      'sale.order': 'sale.order',
      'account.move': 'account.move',
      'purchase.order': 'purchase.order',
      'stock.picking': 'stock.picking'
    };
    return reportMap[model] || null;
  }

  function buildSearchDomain(model, searchTerm) {
    const fields = getSearchFields(model);
    if (!searchTerm || !fields.length) return [];
    if (fields.length === 1) return [[fields[0], 'ilike', searchTerm]];
    const terms = fields.map(function (f) { return [f, 'ilike', searchTerm]; });
    const ops = [];
    for (let i = 0; i < terms.length - 1; i++) ops.push('|');
    return ops.concat(terms);
  }

  function getSavedFiltersFromStorage(model) {
    try {
      const raw = localStorage.getItem('erp_saved_filters_' + (model || '').replace(/\./g, '_'));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function getSavedFilters(model) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) return Promise.resolve(getSavedFiltersFromStorage(model));
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) return getSavedFiltersFromStorage(model);
      const domain = [['model_id', '=', model || ''], '|', ['user_id', '=', false], ['user_id', '=', info.uid]];
      return rpc.callKw('ir.filters', 'search_read', [domain], { fields: ['id', 'name', 'domain'], limit: 100 })
        .then(function (rows) {
          return (rows || []).map(function (r) {
            var dom = [];
            try { dom = r.domain ? JSON.parse(r.domain) : []; } catch (e) {}
            return { id: r.id, name: r.name || 'Filter', domain: dom };
          });
        })
        .catch(function () { return getSavedFiltersFromStorage(model); });
    }).catch(function () { return getSavedFiltersFromStorage(model); });
  }
  function saveSavedFilter(model, name, domain) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model);
      const id = 'f' + Date.now();
      filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve(id);
    }
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        const filters = getSavedFiltersFromStorage(model);
        const id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
        return id;
      }
      return rpc.callKw('ir.filters', 'create', [{
        name: name || 'Filter',
        model_id: model || '',
        domain: JSON.stringify(domain || []),
        user_id: info.uid
      }], {}).then(function (rec) {
        if (!rec) return null;
        if (Array.isArray(rec) && rec.length) return rec[0];
        return rec.ids ? rec.ids[0] : (rec.id != null ? rec.id : null);
      }).catch(function () {
        const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        const filters = getSavedFiltersFromStorage(model);
        const id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
        return id;
      });
    });
  }
  function removeSavedFilter(model, id) {
    if (typeof id === 'string' && id.indexOf('f') === 0) {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
      return Promise.resolve();
    }
    return rpc.callKw('ir.filters', 'unlink', [[parseInt(id, 10)]], {}).catch(function () {
      const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      const filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
    });
  }

  function getFormFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'form');
      if (v && v.fields && v.fields.length) {
        const raw = v.fields.map(f => (typeof f === 'object' ? f.name : f) || f);
        const out = [];
        raw.forEach(function (f) {
          const cf = getMonetaryCurrencyField(model, f);
          if (cf && out.indexOf(cf) < 0) out.push(cf);
          out.push(f);
        });
        return out;
      }
    }
    if (model === 'crm.lead') return ['name', 'type', 'partner_id', 'user_id', 'stage_id', 'ai_score', 'ai_score_label', 'currency_id', 'expected_revenue', 'description', 'note_html', 'tag_ids', 'activity_ids', 'message_ids'];
    if (model === 'sale.order') return ['name', 'partner_id', 'date_order', 'state', 'currency_id', 'amount_total', 'order_line'];
    if (model === 'product.product') return ['name', 'list_price'];
    if (model === 'res.users') return ['name', 'login', 'active', 'group_ids'];
    if (model === 'ir.attachment') return ['name', 'res_model', 'res_id', 'datas'];
    return ['name', 'is_company', 'type', 'email', 'phone', 'street', 'street2', 'city', 'zip', 'country_id', 'state_id'];
  }

  function getTitle(route) {
    if (route === 'contacts') return 'Contacts';
    if (route === 'pipeline') return 'Pipeline';
    if (route === 'crm/activities') return 'CRM Activities';
    if (route === 'leads') return 'Leads';
    if (route === 'orders') return 'Orders';
    if (route === 'products') return 'Products';
    if (route === 'attachments') return 'Attachments';
    if (route === 'settings/users') return 'Users';
    if (route === 'settings/approval_rules') return 'Approval Rules';
    if (route === 'settings/approval_requests') return 'Approval Requests';
    if (route === 'marketing/mailing_lists') return 'Mailing Lists';
    if (route === 'marketing/mailings') return 'Mailings';
    if (route === 'articles') return 'Articles';
    if (route === 'knowledge_categories') return 'Categories';
    if (route === 'leaves') return 'Leaves';
    if (route === 'leave_types') return 'Leave Types';
    if (route === 'allocations') return 'Allocations';
    if (route === 'cron') return 'Scheduled Actions';
    if (route === 'server_actions') return 'Server Actions';
    if (route === 'sequences') return 'Sequences';
    if (route === 'manufacturing') return 'Manufacturing Orders';
    if (route === 'boms') return 'Bills of Materials';
    if (route === 'workcenters') return 'Work Centers';
    if (route === 'transfers') return 'Transfers';
    if (route === 'warehouses') return 'Warehouses';
    if (route === 'purchase_orders') return 'Purchase Orders';
    if (route === 'invoices') return 'Invoices';
    if (route === 'bank_statements') return 'Bank Statements';
    if (route === 'journals') return 'Journals';
    if (route === 'accounts') return 'Chart of Accounts';
    if (route === 'employees') return 'Employees';
    if (route === 'departments') return 'Departments';
    if (route === 'jobs') return 'Job Positions';
    if (route === 'attendances') return 'Attendances';
    if (route === 'recruitment') return 'Recruitment';
    if (route === 'time_off') return 'Time Off';
    if (route === 'expenses') return 'Expenses';
    if (route === 'projects') return 'Projects';
    if (route === 'repair_orders') return 'Repairs';
    if (route === 'surveys') return 'Surveys';
    if (route === 'lunch_orders') return 'Lunch';
    if (route === 'livechat_channels') return 'Live Chat';
    if (route === 'project_todos') return 'To-Do';
    if (route === 'recycle_models') return 'Data Recycle';
    if (route === 'skills') return 'Skills';
    if (route === 'elearning') return 'eLearning';
    if (route === 'timesheets') return 'Timesheets';
    if (route === 'tickets') return 'Tickets';
    if (route === 'crm_stages') return 'CRM Stages';
    if (route === 'crm_tags') return 'CRM Tags';
    if (route === 'crm_lost_reasons') return 'Lost Reasons';
    if (route === 'meetings') return 'Calendar';
    if (route === 'pos_orders') return 'Point of Sale Orders';
    if (route === 'pos_sessions') return 'POS Sessions';
    return route ? (route.charAt(0).toUpperCase() + route.slice(1)) : 'Records';
  }

  String.prototype.escapeHtml = function () {
    const div = document.createElement('div');
    div.textContent = this;
    return div.innerHTML;
  };


  function renderDiscuss(channelId) { if (SR.renderDiscuss) return SR.renderDiscuss(channelId); }
  function renderHome() { if (SR.renderHome) return SR.renderHome(); main.innerHTML = '<p class="o-dashboard-fallback">Home not loaded.</p>'; }
  function renderDashboard() { if (SR.renderDashboard) return SR.renderDashboard(); }
  function renderSettings() { if (SR.renderSettings) return SR.renderSettings(); }
  function renderDashboardWidgets() { if (SR.renderDashboardWidgets) return SR.renderDashboardWidgets(); }
  function renderApiKeysSettings() { if (SR.renderApiKeysSettings) return SR.renderApiKeysSettings(); }
  function renderTotpSettings() { if (SR.renderTotpSettings) return SR.renderTotpSettings(); }


  function getDisplayNames(m, c, r) { return LV.getDisplayNames ? LV.getDisplayNames(m, c, r) : Promise.resolve({}); }
  function getDisplayNamesForMany2many(m, c, r) { return LV.getDisplayNamesForMany2many ? LV.getDisplayNamesForMany2many(m, c, r) : Promise.resolve({}); }
  function renderViewSwitcher(r, v) { return LV.renderViewSwitcher ? LV.renderViewSwitcher(r, v) : ''; }
  function renderList(m, r, recs, s, tc, o, l, sf) { if (LV.renderList) return LV.renderList(m, r, recs, s, tc, o, l, sf); main.innerHTML = '<p class="o-empty">List view unavailable.</p>'; }
  var currentListState = (LV.getCurrentListState ? LV.getCurrentListState() : { model: null, route: null, searchTerm: '', stageFilter: null, viewType: null, savedFilterId: null, offset: 0, limit: 80, order: null, totalCount: 0, activeSearchFilters: [], groupBy: null });
  function deleteRecord(m, r, id) { if (LV.deleteRecord) return LV.deleteRecord(m, r, id); }


  function getViewFieldDef(m, f) { return FV.getViewFieldDef ? FV.getViewFieldDef(m, f) : null; }
  function getFieldMeta(m, f) { return FV.getFieldMeta ? FV.getFieldMeta(m, f) : null; }
  function getMany2oneComodel(m, f) { return FV.getMany2oneComodel ? FV.getMany2oneComodel(m, f) : null; }
  function getMany2oneDomain(m, f) { return FV.getMany2oneDomain ? FV.getMany2oneDomain(m, f) : null; }
  function getSelectionOptions(m, f) { return FV.getSelectionOptions ? FV.getSelectionOptions(m, f) : null; }
  function isBooleanField(m, f) { return FV.isBooleanField ? FV.isBooleanField(m, f) : false; }
  function isMonetaryField(m, f) { return FV.isMonetaryField ? FV.isMonetaryField(m, f) : false; }
  function getMonetaryCurrencyField(m, f) { return FV.getMonetaryCurrencyField ? FV.getMonetaryCurrencyField(m, f) : null; }
  function pad2(n) { return FV.pad2 ? FV.pad2(n) : (n < 10 ? '0' + n : '' + n); }
  function serverValueToDateInput(v) { return FV.serverValueToDateInput ? FV.serverValueToDateInput(v) : ''; }
  function serverValueToDatetimeLocal(v) { return FV.serverValueToDatetimeLocal ? FV.serverValueToDatetimeLocal(v) : ''; }
  function dateInputToServer(v) { return FV.dateInputToServer ? FV.dateInputToServer(v) : false; }
  function datetimeLocalToServer(v) { return FV.datetimeLocalToServer ? FV.datetimeLocalToServer(v) : false; }
  function confirmModal(o) {
    // Track P3: prefer OWL DialogService → legacy FV.confirmModal → native confirm
    var DS = window.AppCore && window.AppCore.DialogService;
    if (DS && typeof DS.confirm === 'function') return DS.confirm(o || {});
    return FV.confirmModal ? FV.confirmModal(o) : Promise.resolve(window.confirm('Are you sure?'));
  }
  function isBinaryField(m, f) { return FV.isBinaryField ? FV.isBinaryField(m, f) : false; }
  function isHtmlField(m, f) { return FV.isHtmlField ? FV.isHtmlField(m, f) : false; }
  function isImageField(m, f) { return FV.isImageField ? FV.isImageField(m, f) : false; }
  function getSelectionLabel(m, f, v) { return FV.getSelectionLabel ? FV.getSelectionLabel(m, f, v) : v; }
  function getOne2manyInfo(m, f) { return FV.getOne2manyInfo ? FV.getOne2manyInfo(m, f) : null; }
  function getOne2manyFieldInputType(m, f, l) { return FV.getOne2manyFieldInputType ? FV.getOne2manyFieldInputType(m, f, l) : 'text'; }
  function renderOne2manyRow(m, f, lf, rd, ri) { return FV.renderOne2manyRow ? FV.renderOne2manyRow(m, f, lf, rd, ri) : ''; }
  function setupOne2manyAddButtons(form, m) { if (FV.setupOne2manyAddButtons) FV.setupOne2manyAddButtons(form, m); }
  function setupOne2manyComputedFields(form, m) { if (FV.setupOne2manyComputedFields) FV.setupOne2manyComputedFields(form, m); }
  function loadChatter(m, rid, mids) { if (FV.loadChatter) FV.loadChatter(m, rid, mids); }
  function setupChatter(form, m, rid) { if (FV.setupChatter) FV.setupChatter(form, m, rid); }
  function getOne2manyLineFields(m, f) { return FV.getOne2manyLineFields ? FV.getOne2manyLineFields(m, f) : []; }
  function getMany2manyInfo(m, f) { return FV.getMany2manyInfo ? FV.getMany2manyInfo(m, f) : null; }
  function getFieldLabel(m, f) { return FV.getFieldLabel ? FV.getFieldLabel(m, f) : f; }
  function isTextField(m, f) { return FV.isTextField ? FV.isTextField(m, f) : false; }
  function parseDomain(s) { return FV.parseDomain ? FV.parseDomain(s) : null; }
  function evaluateDomain(d, v) { return FV.evaluateDomain ? FV.evaluateDomain(d, v) : false; }
  function evaluateCondition(s, v) { return FV.evaluateCondition ? FV.evaluateCondition(s, v) : false; }
  function applyAttrsToForm(form, m) { if (FV.applyAttrsToForm) FV.applyAttrsToForm(form, m); }
  function renderFieldHtml(m, f) { return FV.renderFieldHtml ? FV.renderFieldHtml(m, f) : ''; }
  function renderFormTreeToHtml(m, ch, o) { return FV.renderFormTreeToHtml ? FV.renderFormTreeToHtml(m, ch, o) : ''; }
  function renderForm(m, r, id, s) { if (FV.renderForm) return FV.renderForm(m, r, id, s); main.innerHTML = '<p class="o-empty">Form view unavailable.</p>'; }
  function getFormVals(form, m) { return FV.getFormVals ? FV.getFormVals(form, m) : {}; }
  function showFormError(form, msg) { if (FV.showFormError) FV.showFormError(form, msg); }
  function clearFieldErrors(form) { if (FV.clearFieldErrors) FV.clearFieldErrors(form); }
  function showFieldError(form, f, msg) { if (FV.showFieldError) FV.showFieldError(form, f, msg); }
  function validateRequiredFields(form, m) { return FV.validateRequiredFields ? FV.validateRequiredFields(form, m) : { valid: true, errors: [] }; }
  function setupFormDirtyTracking(form) { if (FV.setupFormDirtyTracking) FV.setupFormDirtyTracking(form); }
  function setupSignatureWidgets(form) { if (FV.setupSignatureWidgets) FV.setupSignatureWidgets(form); }
  function updateDirtyBanner() { if (FV.updateDirtyBanner) FV.updateDirtyBanner(); }
  function handleSaveError(form, m, err, btn) { if (FV.handleSaveError) FV.handleSaveError(form, m, err, btn); }
  function createRecord(m, r, form) { if (FV.createRecord) FV.createRecord(m, r, form); }
  function updateRecord(m, r, id, form) { if (FV.updateRecord) FV.updateRecord(m, r, id, form); }
  function loadRecord(m, id) { return FV.loadRecord ? FV.loadRecord(m, id) : Promise.reject(new Error('Form not loaded')); }


  function getHashViewParam() { return LV.getHashViewParam ? LV.getHashViewParam() : null; }
  function getAvailableViewModes(r) { return LV.getAvailableViewModes ? LV.getAvailableViewModes(r) : ['list']; }
  function getPreferredViewType(r) { return LV.getPreferredViewType ? LV.getPreferredViewType(r) : 'list'; }
  function setViewAndReload(r, v) { if (LV.setViewAndReload) LV.setViewAndReload(r, v); }
  function getSavedFiltersFromStorage(m) { return LV.getSavedFiltersFromStorage ? LV.getSavedFiltersFromStorage(m) : []; }
  function getSavedFilters(m) { return LV.getSavedFilters ? LV.getSavedFilters(m) : Promise.resolve([]); }
  function saveSavedFilter(m, n, d) { return LV.saveSavedFilter ? LV.saveSavedFilter(m, n, d) : Promise.resolve(null); }
  function removeSavedFilter(m, id) { return LV.removeSavedFilter ? LV.removeSavedFilter(m, id) : Promise.resolve(); }
  function loadRecords(m, r, s, sf, vt, sid, oo, or2, dom) { if (LV.loadRecords) return LV.loadRecords(m, r, s, sf, vt, sid, oo, or2, dom); main.innerHTML = '<p class="o-empty">List not loaded.</p>'; }


  function loadActivityData(m, r, d, s, f) { if (CV.loadActivityData) CV.loadActivityData(m, r, d, s, f); }
  function loadGanttData(m, r, d, s, f) { if (CV.loadGanttData) CV.loadGanttData(m, r, d, s, f); }
  function renderGanttView(m, r, recs, s, f, ds, de, g) { if (CV.renderGanttView) CV.renderGanttView(m, r, recs, s, f, ds, de, g); }
  function renderActivityMatrix(m, r, recs, at, acts, s, f, uid) { if (CV.renderActivityMatrix) CV.renderActivityMatrix(m, r, recs, at, acts, s, f, uid); }
  function loadGraphData(m, r, d, s, f) { if (CV.loadGraphData) CV.loadGraphData(m, r, d, s, f); }
  function renderGraph(m, r, gv, rows, gbf, mf, lm, s, f) { if (CV.renderGraph) CV.renderGraph(m, r, gv, rows, gbf, mf, lm, s, f); }
  function loadPivotData(m, r, d, s, f) { if (CV.loadPivotData) CV.loadPivotData(m, r, d, s, f); }
  function renderPivot(m, r, pv, rows, rn, cn, ms, rlm, clm, s, f) { if (CV.renderPivot) CV.renderPivot(m, r, pv, rows, rn, cn, ms, rlm, clm, s, f); }
  function renderCalendar(m, r, recs, s) { if (CV.renderCalendar) CV.renderCalendar(m, r, recs, s); }
  function renderKanban(m, r, recs, s) { if (CV.renderKanban) CV.renderKanban(m, r, recs, s); }

  function isFormRoute(hash) {
    const dataRoutes = DATA_ROUTES_SLUGS.replace(/\//g, '\\/');
    if (new RegExp('^(' + dataRoutes + ')\\/edit\\/\\d+$').test(hash) || new RegExp('^(' + dataRoutes + ')\\/new$').test(hash)) return true;
    var m = hash.match(/^([a-z0-9_/-]+)\/edit\/\d+$/i) || hash.match(/^([a-z0-9_/-]+)\/new$/i);
    return !!(m && getModelForRoute(m[1]));
  }

  function renderAccountingReport(reportType, title) {
    if (CHROME.renderAccountingReport) return CHROME.renderAccountingReport(reportType, title);
  }

  function renderStockValuationReport() {
    if (CHROME.renderStockValuationReport) return CHROME.renderStockValuationReport();
  }

  function renderSalesRevenueReport() {
    if (CHROME.renderSalesRevenueReport) return CHROME.renderSalesRevenueReport();
  }

  /** Phase 632–633: website/eCommerce app roots; phase 633 strict routing for unknown slugs */
  /** @param {{ secondaryActionLabel?: string, secondaryHash?: string }} [placeholderOpts] Phase 687: backend deep link */
  function renderAppShellPlaceholder(route, title, subtitle, placeholderOpts) {
    placeholderOpts = placeholderOpts || {};
    actionStack = [{ label: title, hash: route }];
    var hint = subtitle || 'This surface is not fully wired to the list client yet.';
    var secLabel = placeholderOpts.secondaryActionLabel || '';
    var secHash = placeholderOpts.secondaryHash || '';
    if (window.UIComponents && window.UIComponents.EmptyState && typeof window.UIComponents.EmptyState.renderHTML === 'function') {
      main.innerHTML = window.UIComponents.EmptyState.renderHTML({
        icon: '\u25C7',
        title: title,
        subtitle: hint,
        actionLabel: 'Go to Home',
        secondaryActionLabel: secLabel,
      });
      window.UIComponents.EmptyState.wire(main, {
        actionFn: function () {
          window.location.hash = '#home';
        },
        secondaryActionFn: secHash
          ? function () {
              window.location.hash = '#' + secHash;
            }
          : undefined,
      });
    } else {
      var btn2 =
        secLabel && secHash
          ? '<button type="button" class="o-btn o-btn-secondary o-empty-state-secondary" id="o-placeholder-backend">' +
            String(secLabel).replace(/</g, '&lt;') +
            '</button>'
          : '';
      main.innerHTML =
        '<section class="o-empty-state" role="status">' +
        '<h3 class="o-empty-state-title">' +
        String(title).replace(/</g, '&lt;') +
        '</h3><p class="o-empty-state-subtitle">' +
        String(hint).replace(/</g, '&lt;') +
        '</p>' +
        '<button type="button" class="o-btn o-btn-primary" id="o-placeholder-home">Go to Home</button>' +
        btn2 +
        '</section>';
      var bh = document.getElementById('o-placeholder-home');
      if (bh) {
        bh.onclick = function () {
          window.location.hash = '#home';
        };
      }
      var bb = document.getElementById('o-placeholder-backend');
      if (bb && secHash) {
        bb.onclick = function () {
          window.location.hash = '#' + secHash;
        };
      }
    }
  }

  function renderUnknownRoutePlaceholder(route) {
    var sub =
      'No model mapping for #' +
      String(route || '').replace(/</g, '&lt;') +
      '. Set window.__ERP_DEBUG_SIDEBAR_MENU = true and reload to log unresolved menus.';
    renderAppShellPlaceholder(route, 'Route not available', sub);
  }

  function routeApplyInternal(hash, base) {
    // Use route hash + parseDomainFromRouteHash so list branches never rely on a separate
    // getHashDomainParam binding (Safari/ReferenceError if closure/minify order regresses).
    var listDomainFromHash =
      typeof parseDomainFromRouteHash === "function"
        ? parseDomainFromRouteHash(hash)
        : (window.__ERP_parseDomainFromRouteHash && window.__ERP_parseDomainFromRouteHash(hash)) || [];
    if (main) {
      main.classList.remove("o-view-enter");
      main.classList.add("o-view-exit");
      window.requestAnimationFrame(function () {
        main.classList.remove("o-view-exit");
        main.classList.add("o-view-enter");
      });
    }
    var decoded = window.ActionManager && typeof window.ActionManager.decodeStackFromHash === 'function' ? window.ActionManager.decodeStackFromHash(hash) : null;
    if (decoded && decoded.length) actionStack = decoded;
    var RAR = window.AppCore && window.AppCore.routeApplyRegistry;
    if (RAR && typeof RAR.runBeforeDataRoutes === 'function' && RAR.runBeforeDataRoutes(hash, base)) {
      return;
    }
    const dataRoutes = DATA_ROUTES_SLUGS;
    const editMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/edit\\/(\\d+)$'));
    const newMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/new$'));
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const genericEditMatch = hash.match(/^([a-z0-9_/-]+)\/edit\/(\d+)$/i);
    const genericNewMatch = hash.match(/^([a-z0-9_/-]+)\/new$/i);
    const genericListMatch = base.match(/^([a-z0-9_/-]+)$/i);

    if (listMatch) {
      const route = listMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        // Track O2: prefer OWL controller; fall back to legacy string-HTML
        if (!_tryOwlRoute('list', model, null, { domain: listDomainFromHash })) {
          dispatchActWindowForListRoute(route, { source: 'routeApplyList' });
          loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, listDomainFromHash);
        }
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (newMatch) {
      const route = newMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        if (!_tryOwlRoute('form', model, null)) renderForm(model, route);
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (editMatch) {
      const route = editMatch[1], id = editMatch[2];
      const model = getModelForRoute(route);
      if (model) {
        if (!_tryOwlRoute('form', model, parseInt(id, 10) || id)) renderForm(model, route, id);
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericListMatch) {
      const route = genericListMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        if (!_tryOwlRoute('list', model, null, { domain: listDomainFromHash })) {
          dispatchActWindowForListRoute(route, { source: 'routeApplyList' });
          loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, listDomainFromHash);
        }
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericNewMatch) {
      const route = genericNewMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        if (!_tryOwlRoute('form', model, null)) renderForm(model, route);
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericEditMatch) {
      const route = genericEditMatch[1], id = genericEditMatch[2];
      const model = getModelForRoute(route);
      if (model) {
        if (!_tryOwlRoute('form', model, parseInt(id, 10) || id)) renderForm(model, route, id);
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else {
      renderHome();
    }
  }

  /** Post-1.250: discuss, reports, website/eCommerce placeholders, settings — via route_apply_registry (Phase P1). */
  (function installRouteApplyRegistryPlugins() {
    var R = window.AppCore && window.AppCore.routeApplyRegistry;
    if (!R || typeof R.registerBeforeDataRoutes !== 'function') return;
    R.registerBeforeDataRoutes(function (hash, base) {
      var discussMatch = hash.match(/^discuss$/);
      var discussChannelMatch = hash.match(/^discuss\/(\d+)$/);
      if (discussMatch || discussChannelMatch) {
        renderDiscuss(discussChannelMatch ? discussChannelMatch[1] : null);
        return true;
      }
      if (hash.match(/^reports\/trial-balance$/)) {
        renderAccountingReport('trial-balance', 'Trial Balance');
        return true;
      }
      if (hash.match(/^reports\/profit-loss$/)) {
        renderAccountingReport('profit-loss', 'Profit & Loss');
        return true;
      }
      if (hash.match(/^reports\/balance-sheet$/)) {
        renderAccountingReport('balance-sheet', 'Balance Sheet');
        return true;
      }
      if (hash.match(/^reports\/stock-valuation$/)) {
        renderStockValuationReport();
        return true;
      }
      if (hash.match(/^reports\/sales-revenue$/)) {
        renderSalesRevenueReport();
        return true;
      }
      if (base === 'website') {
        renderAppShellPlaceholder(
          'website',
          'Website',
          'Website pages and editor are scaffolded in modules; open Products for catalogue data, or Home.',
          { secondaryActionLabel: 'Open Products', secondaryHash: 'products' }
        );
        return true;
      }
      if (base === 'ecommerce') {
        renderAppShellPlaceholder(
          'ecommerce',
          'eCommerce',
          'Shop flows are partially scaffolded. Use Products, Sale Orders, or Invoicing for catalogue and orders.',
          { secondaryActionLabel: 'Open Sale Orders', secondaryHash: 'orders' }
        );
        return true;
      }
      if (hash.match(/^settings\/apikeys$/)) {
        renderApiKeysSettings();
        return true;
      }
      if (hash.match(/^settings\/totp$/)) {
        renderTotpSettings();
        return true;
      }
      if (hash.match(/^settings\/dashboard-widgets$/)) {
        renderDashboardWidgets();
        return true;
      }
      if (hash.match(/^settings\/?$/)) {
        renderSettings();
        return true;
      }
      return false;
    });
  })();

  function routeInternal() {
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
    if (formDirty && isFormRoute(lastHash) && hash !== lastHash) {
      confirmModal({ title: 'Unsaved changes', message: 'Leave without saving?', confirmLabel: 'Leave', cancelLabel: 'Stay' }).then(function (ok) {
        if (!ok) {
          window.location.hash = lastHash;
          return;
        }
        formDirty = false;
        lastHash = hash;
        routeApply(hash, base);
      });
      return;
    }
    lastHash = hash;
    routeApplyInternal(hash, base);
  }

  function routeApply(hash, base) {
    if (RouterCore && typeof RouterCore.routeApply === "function") {
      return RouterCore.routeApply(hash, base);
    }
    return routeApplyInternal(hash, base);
  }

  function route() {
    if (RouterCore && typeof RouterCore.route === "function") {
      return RouterCore.route();
    }
    return routeInternal();
  }

  if (RouterCore && typeof RouterCore.setHandlers === "function") {
    RouterCore.setHandlers({
      renderNavbar: function () {
        renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
      },
      applyRoute: routeApplyInternal,
      isFormRoute: isFormRoute,
      confirmLeave: function () {
        return confirmModal({
          title: "Unsaved changes",
          message: "Leave without saving?",
          confirmLabel: "Leave",
          cancelLabel: "Stay",
        });
      },
    });
    if (typeof RouterCore.setState === "function") {
      RouterCore.setState({ dirty: formDirty, lastHash: lastHash });
    }
  }

  window.addEventListener('hashchange', route);

  /* Alt+ shortcuts: see core/webclient_shortcut_contract.js → __ERP_WEBCLIENT_SHORTCUT_CONTRACT */
  document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
      var closeBtn = document.querySelector(".o-report-preview-close, .o-attachment-close");
      if (closeBtn) {
        e.preventDefault();
        closeBtn.click();
        return;
      }
    }
    if (!e.altKey) return;
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    const dataRoutes = DATA_ROUTES_SLUGS;
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const formMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/(edit\\/\\d+|new)$'));
    if (e.key === 'n' && listMatch) {
      e.preventDefault();
      window.location.hash = listMatch[1] + '/new';
    } else if (e.key === 's' || e.key === 'S') {
      if (formMatch) {
        const btn = document.getElementById('btn-save');
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    } else if (e.key === 'e' || e.key === 'E') {
      const editBtn = document.querySelector('.btn-edit, #btn-edit');
      if (editBtn) {
        e.preventDefault();
        editBtn.click();
      }
    } else if (e.key === 'l' || e.key === 'L') {
      if (formMatch) {
        e.preventDefault();
        var routeList = formMatch[1];
        window.location.hash = routeList;
        /* Phase 668: hashchange runs routeApplyInternal → dispatchActWindowForListRoute for list slug */
      }
    } else if (e.key === 'k' || e.key === 'K') {
      if (listMatch) {
        e.preventDefault();
        currentListState.viewType = "kanban";
        var routeKanban = listMatch[1];
        dispatchActWindowForListRoute(routeKanban, { source: 'shortcutAltK' });
        const model = getModelForRoute(routeKanban);
        if (model) loadRecords(model, routeKanban, currentListState.searchTerm || "");
      }
    } else if (e.key === 'p' || e.key === 'P') {
      const previewBtn = document.getElementById("btn-preview-pdf") || document.getElementById("btn-print-form");
      if (previewBtn) {
        e.preventDefault();
        previewBtn.click();
      }
    }
  });

  window.addEventListener('bus:message', function (e) {
    const d = e.detail || {};
    const msg = d.message || {};
    if (msg.type === 'stage_change') {
      showToast('Lead stage updated', 'info');
      if (lastHash && lastHash.indexOf('leads') >= 0) {
        const model = getModelForRoute('leads');
        if (model) loadRecords(model, 'leads', currentListState.searchTerm);
      }
    }
    if (msg.type === 'message') {
      const formModel = document.querySelector('[data-model]');
      if (formModel && msg.res_model === formModel.getAttribute('data-model')) {
        const formId = document.querySelector('[data-record-id]');
        if (formId && parseInt(formId.getAttribute('data-record-id'), 10) === msg.res_id) {
          const chatterDiv = document.querySelector('#chatter-messages');
          if (chatterDiv) {
            rpc.callKw(msg.res_model, 'read', [[msg.res_id], ['message_ids']]).then(function (recs) {
              if (recs && recs[0] && recs[0].message_ids) loadChatter(msg.res_model, String(msg.res_id), recs[0].message_ids);
            });
          }
        }
      }
    }
  });

  window.__erpForm = {
    renderFieldHtml: renderFieldHtml,
    renderFormTreeToHtml: renderFormTreeToHtml,
  };
  if (window.AppCore) {
    if (AppCore.FormView && typeof AppCore.FormView.setImpl === "function") {
      AppCore.FormView.setImpl({
        renderFieldHtml: renderFieldHtml,
        renderFormTreeToHtml: renderFormTreeToHtml,
        render: function (_container, opts) {
          renderForm(opts.model, opts.route, opts.id, true);
          return true;
        },
      });
    }
    if (!modernShellOwner && AppCore.Navbar && typeof AppCore.Navbar.setImpl === "function") {
      AppCore.Navbar.setImpl(function (opts) {
        // Keep runtime behavior in main.js while exposing extraction boundary.
        return false;
      });
    }
    if (AppCore.Sidebar && typeof AppCore.Sidebar.setImpl === "function") {
      AppCore.Sidebar.setImpl({
        render: function (opts) {
          return opts && opts.buildSidebarNavHtml
            ? opts.buildSidebarNavHtml(opts.tree || [], opts.staleBannerHtml || "")
            : "";
        },
        wire: function (opts) {
          if (opts && typeof opts.wireSidebarAfterRender === "function") {
            opts.wireSidebarAfterRender();
            return true;
          }
          return false;
        },
      });
    }
    if (AppCore.GraphView && typeof AppCore.GraphView.setImpl === "function") AppCore.GraphView.setImpl(renderGraph);
    if (AppCore.PivotView && typeof AppCore.PivotView.setImpl === "function") AppCore.PivotView.setImpl(renderPivot);
    if (AppCore.CalendarView && typeof AppCore.CalendarView.setImpl === "function") AppCore.CalendarView.setImpl(renderCalendar);
    if (AppCore.GanttView && typeof AppCore.GanttView.setImpl === "function") AppCore.GanttView.setImpl(renderGanttView);
    if (AppCore.ActivityView && typeof AppCore.ActivityView.setImpl === "function") AppCore.ActivityView.setImpl(renderActivityMatrix);
    if (AppCore.DiscussView && typeof AppCore.DiscussView.setImpl === "function") {
      AppCore.DiscussView.setImpl(function () {
        return false;
      });
    }
    /* List: core/list_view.js is primary; renderList else-branch uses AppCore.ListViewModule. */
    if (AppCore.ListView && typeof AppCore.ListView.setImpl === "function") {
      AppCore.ListView.setImpl(function () {
        return false;
      });
    }
  }


  /* Phase 1.245: install extraction module contexts */
  if (FV.install) FV.install({
    viewsSvc: viewsSvc, rpc: rpc, showToast: showToast, main: main,
    getFormDirty: function () { return formDirty; }, setFormDirty: function (v) { formDirty = v; },
    getActionStack: function () { return actionStack; }, setActionStack: function (s) { actionStack = s; },
    getCurrentListState: function () { return currentListState; },
    loadRecords: function () { return loadRecords.apply(null, arguments); },
    pushBreadcrumb: pushBreadcrumb, renderBreadcrumbs: renderBreadcrumbs, attachBreadcrumbHandlers: attachBreadcrumbHandlers,
    dispatchActWindowForListRoute: dispatchActWindowForListRoute, dispatchListActWindowThenFormHash: dispatchListActWindowThenFormHash,
    getFormFields: getFormFields, getTitle: getTitle, getReportName: getReportName, getListColumns: getListColumns,
    skeletonHtml: skeletonHtml, actionToRoute: actionToRoute, getActionForRoute: getActionForRoute,
    deleteRecord: function () { return deleteRecord.apply(null, arguments); },
  });
  if (LV.install) LV.install({
    rpc: rpc, viewsSvc: viewsSvc, showToast: showToast, main: main,
    getMany2oneComodel: function () { return getMany2oneComodel.apply(null, arguments); },
    getMany2manyInfo: function () { return getMany2manyInfo.apply(null, arguments); },
    isMonetaryField: function () { return isMonetaryField.apply(null, arguments); },
    getMonetaryCurrencyField: function () { return getMonetaryCurrencyField.apply(null, arguments); },
    getSelectionLabel: function () { return getSelectionLabel.apply(null, arguments); },
    getFieldMeta: function () { return getFieldMeta.apply(null, arguments); },
    getSelectionOptions: function () { return getSelectionOptions.apply(null, arguments); },
    getListColumns: getListColumns, getTitle: getTitle, getReportName: getReportName,
    getActionForRoute: getActionForRoute, actionToRoute: actionToRoute,
    parseActionDomain: parseActionDomain, parseFilterDomain: parseFilterDomain,
    buildSearchDomain: buildSearchDomain,
    getHashDomainParam: function () {
      if (typeof getHashDomainParam === 'function') return getHashDomainParam.apply(null, arguments);
      var g = typeof window !== 'undefined' && window.__ERP_getHashDomainParam;
      return typeof g === 'function' ? g.apply(null, arguments) : null;
    },
    showImportModal: showImportModal, confirmModal: function () { return confirmModal.apply(null, arguments); },
    getAvailableViewModes: function () { return getAvailableViewModes.apply(null, arguments); },
    setViewAndReload: function () { return setViewAndReload.apply(null, arguments); },
    dispatchActWindowForListRoute: dispatchActWindowForListRoute,
    dispatchListActWindowThenFormHash: dispatchListActWindowThenFormHash,
    applyActionStackForList: applyActionStackForList,
    attachActWindowFormLinkDelegation: attachActWindowFormLinkDelegation,
    renderViewSwitcher: function () { return renderViewSwitcher.apply(null, arguments); },
    skeletonHtml: skeletonHtml,
    getCurrentListState: function () { return currentListState; },
    setCurrentListState: function (s) { currentListState = s; },
    getActionStack: function () { return actionStack; },
    setActionStack: function (s) { actionStack = s; },
  });
  if (CV.install) CV.install({
    rpc: rpc, viewsSvc: viewsSvc, showToast: showToast, main: main,
    getTitle: getTitle,
    renderViewSwitcher: function () { return renderViewSwitcher.apply(null, arguments); },
    loadRecords: function () { return loadRecords.apply(null, arguments); },
    dispatchListActWindowThenFormHash: dispatchListActWindowThenFormHash,
    setViewAndReload: function () { return setViewAndReload.apply(null, arguments); },
    attachActWindowFormLinkDelegation: attachActWindowFormLinkDelegation,
    buildSearchDomain: buildSearchDomain,
    getCurrentListState: function () { return currentListState; },
    setCurrentListState: function (s) { currentListState = s; },
    getActionStack: function () { return actionStack; },
    setActionStack: function (s) { actionStack = s; },
  });
  if (SR.install) SR.install({
    rpc: rpc, viewsSvc: viewsSvc, showToast: showToast, main: main,
    navbar: navbar, appShell: appShell, appSidebar: appSidebar,
    getActionStack: function () { return actionStack; },
    setActionStack: function (s) { actionStack = s; },
    actionToRoute: actionToRoute, menuToRoute: menuToRoute,
    _warnSidebarMenuDisabled: _warnSidebarMenuDisabled,
    renderBreadcrumbs: renderBreadcrumbs, attachBreadcrumbHandlers: attachBreadcrumbHandlers,
    navigateActWindowIfAvailable: navigateActWindowIfAvailable,
    route: function () { return route(); },
    renderNavbar: function () { return renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang); },
    renderSystrayMount: renderSystrayMount,
    navContext: navContext,
  });
  if (CHROME.install) CHROME.install({
    modernShellOwner: modernShellOwner,
    NavbarCore: NavbarCore,
    navbar: navbar,
    appShell: appShell,
    appSidebar: appSidebar,
    viewsSvc: viewsSvc,
    buildMenuTree: buildMenuTree,
    getAppRoots: getAppRoots,
    getAppIdForRoute: getAppIdForRoute,
    escNavHtml: escNavHtml,
    actionToRoute: actionToRoute,
    menuToRoute: menuToRoute,
    renderSystrayMount: renderSystrayMount,
    SidebarCore: SidebarCore,
    buildSidebarNavHtml: buildSidebarNavHtml,
    wireSidebarAfterRender: wireSidebarAfterRender,
    getListColumns: getListColumns,
    showToast: showToast,
    parseCSV: parseCSV,
    ImportCore: ImportCore,
    loadRecords: loadRecords,
    getCurrentListState: function () { return currentListState; },
    setActionStack: function (s) { actionStack = s; },
    GraphViewCore: GraphViewCore,
    main: main,
    rpc: rpc,
    skeletonHtml: skeletonHtml,
  });

  function bootLegacyWebClient() {
    if (window.__erpLegacyRuntime && window.__erpLegacyRuntime.booted) {
      return;
    }
    if (window.__erpLegacyRuntime) {
      window.__erpLegacyRuntime.booted = true;
    }
    // Apply theme immediately to avoid flash (localStorage or prefers-color-scheme)
    const savedTheme = typeof localStorage !== 'undefined' && localStorage.getItem('erp_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    const sessionP = (window.Services && window.Services.session) ? window.Services.session.getSessionInfo() : Promise.resolve(null);
    const viewsP = viewsSvc ? viewsSvc.load() : Promise.resolve();
    const timeoutMs = 15000;
    const timeoutP = new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Load timeout')); }, timeoutMs);
    });
    Promise.race([Promise.all([sessionP, viewsP]), timeoutP]).then(function (results) {
      const sessionData = results[0];
      const userCompanies = sessionData && sessionData.user_companies ? sessionData.user_companies : null;
      const userLangs = sessionData && sessionData.user_langs ? sessionData.user_langs : [];
      const currentLang = sessionData && sessionData.lang ? sessionData.lang : 'en_US';
      navContext.userCompanies = userCompanies;
      navContext.userLangs = userLangs;
      navContext.currentLang = currentLang;
      if (modernShellOwner) {
        window.dispatchEvent(new CustomEvent("erp:navigation-context", {
          detail: {
            userCompanies: userCompanies,
            userLangs: userLangs,
            currentLang: currentLang,
          },
        }));
      }
      if (window.Services && window.Services.i18n) {
        window.Services.i18n.loadFromServer(currentLang).then(function () {
          renderNavbar(userCompanies, userLangs, currentLang);
          route();
        }).catch(function () {
          renderNavbar(userCompanies, userLangs, currentLang);
          route();
        });
      } else {
        renderNavbar(userCompanies, userLangs, currentLang);
        route();
      }
      if (window.Services && window.Services.bus && sessionData && sessionData.uid) {
        window.Services.bus.start(['res.partner_' + sessionData.uid]);
      }
    }).catch(function (err) {
      main.innerHTML = '<h2>Unable to load</h2><p class="o-error-panel__muted">' +
        (err && err.message ? String(err.message).replace(/</g, '&lt;') : 'Network or server error') + '</p>' +
        '<p class="o-error-panel__links"><a href="/web/login">Go to login</a> &middot; <a href="javascript:location.reload()">Retry</a></p>';
    });
  }

  window.__erpLegacyRuntime = window.__erpLegacyRuntime || {};
  window.__erpLegacyRuntime.start = bootLegacyWebClient;
  window.__erpLegacyRuntime.booted = false;
  window.__erpLegacyRuntime.renderSystrayMount = renderSystrayMount;

  /* Phase 771–772: facades for RouterService / BreadcrumbService migration (see services/erp_*_facade.js). */
  window.ErpLegacyRouter = window.ErpLegacyRouter || {};
  window.ErpLegacyRouter.routeApplyInternal = routeApplyInternal;
  window.ErpLegacyRouter.routeInternal = routeInternal;
  window.ErpLegacyRouter.routeApply = routeApply;
  window.ErpLegacyRouter.route = route;
  window.ErpBreadcrumbFacade = window.ErpBreadcrumbFacade || {};
  window.ErpBreadcrumbFacade.pushBreadcrumb = pushBreadcrumb;
  window.ErpBreadcrumbFacade.popBreadcrumbTo = popBreadcrumbTo;
  window.ErpBreadcrumbFacade.syncHashWithActionStackIfMulti = syncHashWithActionStackIfMulti;
  window.ErpBreadcrumbFacade.applyActionStackForList = applyActionStackForList;
  window.ErpBreadcrumbFacade.renderBreadcrumbs = renderBreadcrumbs;
  window.ErpBreadcrumbFacade.attachBreadcrumbHandlers = attachBreadcrumbHandlers;

  if (frontendBootstrap.runtime !== 'modern') {
    bootLegacyWebClient();
  }
})();
