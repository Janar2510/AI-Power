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
    return '<p style="color:var(--text-muted)">Loading...</p>';
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


  function showImportModal(model, route) {
    const cols = getListColumns(model);
    const modelFields = ['id'].concat(cols.map(function (c) { return typeof c === 'object' ? c.name : c; }));
    const overlay = document.createElement('div');
    overlay.id = 'import-modal-overlay';
    overlay.className = 'o-import-modal-overlay';
    let html = '<div id="import-modal" class="o-import-modal-panel" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">';
    html += '<h3 id="import-modal-title" class="o-import-modal-title">Import CSV / Excel</h3>';
    html += '<p><input type="file" id="import-file" class="o-import-modal-file" accept=".csv,.xlsx"></p>';
    html += '<div id="import-preview" class="o-import-modal-hidden">';
    html += '<p><strong>Preview (first 5 rows)</strong></p>';
    html += '<div id="import-preview-table"></div>';
    html += '<p><strong>Column mapping</strong></p>';
    html += '<div id="import-mapping"></div>';
    html += '<p class="o-import-modal-actions"><button type="button" id="import-do-btn" class="o-btn o-btn-primary">Import</button>';
    html += ' <button type="button" id="import-cancel-btn" class="o-btn o-btn-secondary">Cancel</button></p>';
    html += '</div>';
    html += '<div id="import-result" class="o-import-modal-hidden"></div>';
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    const modal = document.getElementById('import-modal');
    const focusables = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    function getFocusables() { return modal ? modal.querySelectorAll(focusables) : []; }
    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const els = getFocusables();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function closeOnEscape(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', closeOnEscape); overlay.remove(); }
    }
    function closeModal() {
      document.removeEventListener('keydown', closeOnEscape);
      overlay.remove();
    }
    modal.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', closeOnEscape);
    setTimeout(function () { const f = document.getElementById('import-file'); if (f) f.focus(); }, 50);
    let csvHeaders = [];
    let csvRows = [];
    let importFile = null;
    const fileInput = document.getElementById('import-file');
    fileInput.onchange = function () {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      importFile = f;
      csvRows = [];
      const isXlsx = (f.name || '').toLowerCase().endsWith('.xlsx');
      if (isXlsx) {
        const fd = new FormData();
        fd.append('file', f);
      const authHdrs = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
      fetch('/web/import/preview', { method: 'POST', credentials: 'include', headers: authHdrs, body: fd })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error, 'error'); return; }
            csvHeaders = data.headers || [];
            csvRows = data.rows || [];
            renderImportPreview();
          })
          .catch(function () { showToast('Preview failed', 'error'); });
      } else {
        const r = new FileReader();
        r.onload = function () {
          const parsed = parseCSV(r.result || '');
          if (!parsed.length) { showToast('No rows in CSV', 'error'); return; }
          csvHeaders = parsed[0];
          csvRows = parsed.slice(1);
          renderImportPreview();
        };
        r.readAsText(f);
      }
      importFile = f;
    };
    function renderImportPreview() {
      if (ImportCore && typeof ImportCore.renderPreview === "function") {
        var previewHtml = ImportCore.renderPreview(csvHeaders || [], csvRows || [], modelFields || []);
        if (previewHtml && previewHtml.table && previewHtml.mapping) {
          document.getElementById('import-preview-table').innerHTML = previewHtml.table;
          document.getElementById('import-mapping').innerHTML = previewHtml.mapping;
          document.getElementById('import-preview').classList.remove('o-import-modal-hidden');
          return;
        }
      }
      const preview = csvRows.slice(0, 5);
      let tbl = '<table class="o-import-modal-table"><tr>';
      csvHeaders.forEach(function (h) { tbl += '<th>' + String(h).replace(/</g, '&lt;') + '</th>'; });
      tbl += '</tr>';
      preview.forEach(function (row) {
        tbl += '<tr>';
        csvHeaders.forEach(function (_, i) { tbl += '<td>' + String((row && row[i]) || '').replace(/</g, '&lt;') + '</td>'; });
        tbl += '</tr>';
      });
      tbl += '</table>';
      document.getElementById('import-preview-table').innerHTML = tbl;
      let mapHtml = '<table class="o-import-modal-table"><tr><th>Column</th><th>Map to field</th></tr>';
      csvHeaders.forEach(function (h, i) {
        mapHtml += '<tr><td>' + String(h).replace(/</g, '&lt;') + '</td><td><select class="import-map-select o-import-modal-map-select" data-csv-idx="' + i + '">';
        mapHtml += '<option value="">-- Skip --</option>';
        const autoMatch = modelFields.find(function (mf) { return mf.toLowerCase() === String(h).toLowerCase().replace(/\s/g, '_'); });
        modelFields.forEach(function (mf) {
          const sel = (autoMatch === mf || (!autoMatch && mf === h)) ? ' selected' : '';
          mapHtml += '<option value="' + (mf || '').replace(/"/g, '&quot;') + '"' + sel + '>' + (mf || '').replace(/</g, '&lt;') + '</option>';
        });
        mapHtml += '</select></td></tr>';
      });
      mapHtml += '</table>';
      document.getElementById('import-mapping').innerHTML = mapHtml;
      document.getElementById('import-preview').classList.remove('o-import-modal-hidden');
    }
    document.getElementById('import-do-btn').onclick = function () {
      const selects = overlay.querySelectorAll('.import-map-select');
      const csvIdxToField = {};
      selects.forEach(function (s) {
        const idx = parseInt(s.dataset.csvIdx, 10);
        const f = s.value;
        if (f) csvIdxToField[idx] = f;
      });
      const fieldSet = {};
      const fields = [];
      Object.keys(csvIdxToField).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); }).forEach(function (idx) {
        const f = csvIdxToField[idx];
        if (!fieldSet[f]) { fields.push(f); fieldSet[f] = true; }
      });
      if (!fields.length) { showToast('Map at least one column', 'error'); return; }
      const mapping = {};
      Object.keys(csvIdxToField).forEach(function (k) { mapping[k] = csvIdxToField[k]; });
      if (!importFile) { showToast('Select a file first', 'error'); return; }
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('model', model);
      fd.append('mapping', JSON.stringify(mapping));
      const authHdrsExec = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
      fetch('/web/import/execute', { method: 'POST', credentials: 'include', headers: authHdrsExec, body: fd })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error(data.error || 'Import failed');
            return data;
          });
        })
        .then(handleImportResult)
        .catch(function (err) { showToast(err.message || 'Import failed', 'error'); });
    };
    function handleImportResult(res) {
      document.getElementById('import-preview').classList.add('o-import-modal-hidden');
      const r = document.getElementById('import-result');
      r.classList.remove('o-import-modal-hidden');
      r.innerHTML = '<p><strong>Import complete</strong></p><p>Created: ' + (res.created || 0) + ', Updated: ' + (res.updated || 0) + '</p>';
      if (res.errors && res.errors.length) {
        r.innerHTML += '<p class="o-import-modal-error">Errors:</p><table class="o-import-modal-table"><tr><th>Row</th><th>Field</th><th>Message</th></tr>';
        res.errors.forEach(function (e) {
          r.innerHTML += '<tr><td>' + (e.row || '') + '</td><td>' + (e.field || '').replace(/</g, '&lt;') + '</td><td>' + (e.message || '').replace(/</g, '&lt;') + '</td></tr>';
        });
        r.innerHTML += '</table>';
      }
      r.innerHTML += '<p class="o-import-modal-actions"><button type="button" id="import-close-btn" class="o-btn o-btn-primary">Close</button></p>';
      document.getElementById('import-close-btn').onclick = function () {
        closeModal();
        loadRecords(model, route, currentListState.searchTerm);
      };
      if (!res.errors || !res.errors.length) {
        showToast('Imported ' + (res.created || 0) + ' created, ' + (res.updated || 0) + ' updated', 'success');
        setTimeout(function () {
          closeModal();
          loadRecords(model, route, currentListState.searchTerm);
        }, 1500);
      }
    }
    document.getElementById('import-cancel-btn').onclick = closeModal;
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
    if (VM && typeof VM.openFromActWindow === 'function' && action) {
      if (window.location.hash === nextHash) {
        renderNavbar(navContext.userCompanies, navContext.userLangs, navContext.currentLang);
        route();
        return true;
      }
      VM.openFromActWindow(action, opt);
      return true;
    }
    return false;
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
    if (modernShellOwner && window.__erpModernShellController) {
      window.__erpModernShellController.applyNavContext({
        userCompanies: userCompanies || null,
        userLangs: userLangs || [],
        currentLang: currentLang || "en_US",
      });
      return true;
    }
    if (NavbarCore && typeof NavbarCore.render === "function") {
      var coreHandled = NavbarCore.render({
        navbar: navbar,
        appShell: appShell,
        appSidebar: appSidebar,
        userCompanies: userCompanies || [],
        userLangs: userLangs || [],
        currentLang: currentLang || "en_US",
        viewsSvc: viewsSvc,
      });
      if (coreHandled) return;
    }
    if (!navbar) return;
    userLangs = userLangs || [];
    currentLang = currentLang || 'en_US';
    var menus = (viewsSvc && viewsSvc.getMenus()) ? viewsSvc.getMenus() : [];
    var tree = menus.length ? buildMenuTree(menus) : [];
    var appRoots = getAppRoots(tree, menus);
    var routeHash = (window.location.hash || '#home').replace(/^#/, '');
    var routeBase = routeHash.split('?')[0];
    /* Home / apps grid: do not use stored app or first-app fallback for chrome — hash drives main
       content (#home) while stored erp_sidebar_app made sidebar/header show a different app (Phase nav fix). */
    var atHome = routeBase === '' || routeBase === 'home';
    var autoAppId = getAppIdForRoute(routeBase, menus);
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
    var useSidebar = !!appSidebar;
    var staleBannerHtml = '';
    if (menus.length === 0) {
      staleBannerHtml = 'Navigation menus missing. Run: <code style="padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--color-text) 12%,transparent)">erp-bin db upgrade -d ' +
        escNavHtml(window.Session && window.Session.db ? String(window.Session.db) : 'erp') + '</code>';
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
        html += '<span class="nav-current-app">' + escNavHtml(selectedAppName) + '</span>';
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
          const action = m.action ? viewsSvc.getAction(m.action) : null;
          const route = action ? actionToRoute(action) : menuToRoute(m);
          const href = route ? '#' + route : '#';
          const cls = 'nav-link' + (route ? '' : ' nav-link-disabled');
          if (node.children.length) {
            html += '<span class="nav-dropdown" style="position:relative;display:inline-block">';
            html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
            html += '<span class="nav-dropdown-content" style="display:none;position:absolute;top:100%;left:0;background:#1a1a2e;min-width:140px;padding:0.5rem 0;border-radius:4px;z-index:100">';
            node.children.forEach(function (ch) {
              const cm = ch.menu;
              const caction = cm.action ? viewsSvc.getAction(cm.action) : null;
              const croute = caction ? actionToRoute(caction) : menuToRoute(cm);
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
    navbar.innerHTML = html;
    if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === 'function') {
      window.__erpNavbarContract.markDelegated(navbar);
    }
    renderSystrayMount();
    if (appSidebar) {
      var sidebarTree = tree;
      if (appRoots.length && selectedAppId) {
        if (selectedRoot) {
          sidebarTree = selectedRoot.children && selectedRoot.children.length
            ? selectedRoot.children
            : [selectedRoot];
        }
      }
      if (SidebarCore && typeof SidebarCore.render === "function") {
        appSidebar.innerHTML = SidebarCore.render({
          tree: sidebarTree,
          staleBannerHtml: staleBannerHtml,
          buildSidebarNavHtml: buildSidebarNavHtml,
        }) || buildSidebarNavHtml(sidebarTree, staleBannerHtml);
        if (typeof SidebarCore.wire === "function") {
          SidebarCore.wire({ wireSidebarAfterRender: wireSidebarAfterRender });
        } else {
          wireSidebarAfterRender();
        }
      } else {
        appSidebar.innerHTML = buildSidebarNavHtml(sidebarTree, staleBannerHtml);
        wireSidebarAfterRender();
      }
    }
    var appsHomeBtn = navbar.querySelector('#nav-apps-home');
    if (appsHomeBtn) {
      appsHomeBtn.addEventListener('click', function () {
        window.location.hash = '#home';
      });
    }
    var hamburger = navbar.querySelector('.nav-hamburger');
    var navMenu = navbar.querySelector('.nav-menu');
    if (hamburger && navMenu && !appSidebar) {
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
    if (appSidebar && hamburger) {
      function syncMobileHamburgerVisibility() {
        hamburger.style.display = (window.innerWidth <= 1023) ? 'inline-flex' : 'none';
      }
      syncMobileHamburgerVisibility();
      window.addEventListener('resize', syncMobileHamburgerVisibility);
    }
    navbar.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.onclick = function () {
        const root = document.documentElement;
        const cur = root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = cur === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        if (typeof localStorage !== 'undefined') localStorage.setItem('erp_theme', next);
        btn.textContent = next === 'dark' ? '\u263D' : '\u263C';
      };
    });
    navbar.querySelectorAll('.nav-dropdown').forEach(function (dd) {
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
              navbar.querySelectorAll('.nav-dropdown-open').forEach(function (o) {
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
    navbar.querySelectorAll('.company-option').forEach(function (btn) {
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
    navbar.querySelectorAll('.lang-option').forEach(function (btn) {
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
    var bellBtn = navbar.querySelector('.notification-bell-btn');
    var bellDropdown = navbar.querySelector('.notification-dropdown');
    var badgeEl = navbar.querySelector('.notification-badge');
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
    if (navbar.querySelector('.mark-all-read')) {
      navbar.querySelector('.mark-all-read').onclick = function () {
        var markReadHdrs = { 'Content-Type': 'application/json' };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(markReadHdrs, window.Services.session.getAuthHeaders());
        fetch('/mail/notifications/mark_read', { method: 'POST', credentials: 'include', headers: markReadHdrs, body: JSON.stringify({ all: true }) }).then(function () { loadNotificationCount(); loadNotificationList(); });
      };
    }
    loadNotificationCount();
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
  function confirmModal(o) { return FV.confirmModal ? FV.confirmModal(o) : Promise.resolve(window.confirm('Are you sure?')); }
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
    if (GraphViewCore && typeof GraphViewCore.renderAccountingReport === "function") {
      var graphHandled = GraphViewCore.renderAccountingReport(main, { reportType: reportType, title: title, rpc: rpc });
      if (graphHandled) return;
    }
    actionStack = [{ label: title, hash: 'reports/' + reportType }];
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = today.slice(0, 4) + '-01-01';
    main.innerHTML = '<h2>' + title + '</h2><p style="margin-bottom:1rem">' +
      '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      const df = document.getElementById('report-date-from').value || yearStart;
      const dt = document.getElementById('report-date-to').value || today;
      const method = reportType === 'trial-balance' ? 'get_trial_balance' : (reportType === 'profit-loss' ? 'get_profit_loss' : 'get_balance_sheet');
      const args = reportType === 'balance-sheet' ? [dt] : [df, dt];
      rpc.callKw('account.account', method, args, {})
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = Object.keys(rows[0]);
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && (c === 'debit' || c === 'credit' || c === 'balance')) ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
  }

  function renderStockValuationReport() {
    if (GraphViewCore && typeof GraphViewCore.renderStockValuationReport === "function") {
      var stockHandled = GraphViewCore.renderStockValuationReport(main, { rpc: rpc });
      if (stockHandled) return;
    }
    actionStack = [{ label: 'Stock Valuation', hash: 'reports/stock-valuation' }];
    main.innerHTML = '<h2>Stock Valuation</h2><p style="margin-bottom:1rem">' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      rpc.callKw('product.product', 'get_stock_valuation_report', [], {})
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = ['product', 'category', 'qty_available', 'standard_price', 'total_value'];
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && (c === 'standard_price' || c === 'total_value')) ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
  }

  function renderSalesRevenueReport() {
    if (GraphViewCore && typeof GraphViewCore.renderSalesRevenueReport === "function") {
      var salesHandled = GraphViewCore.renderSalesRevenueReport(main, { rpc: rpc });
      if (salesHandled) return;
    }
    actionStack = [{ label: 'Sales Revenue', hash: 'reports/sales-revenue' }];
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = today.slice(0, 4) + '-01-01';
    main.innerHTML = '<h2>Sales Revenue</h2><p style="margin-bottom:1rem">' +
      '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
      '<label>Group by <select id="report-group-by" style="padding:0.35rem;margin:0 0.5rem"><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="product">Product</option></select></label>' +
      '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
      '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;margin-left:0.25rem">Print</button>' +
      '</p><div id="report-table" style="overflow-x:auto">' + skeletonHtml(8, true) + '</div>';
    function loadReport() {
      const df = document.getElementById('report-date-from').value || yearStart;
      const dt = document.getElementById('report-date-to').value || today;
      const groupBy = (document.getElementById('report-group-by') && document.getElementById('report-group-by').value) || 'month';
      rpc.callKw('sale.order', 'get_sales_revenue_report', [df, dt], { group_by: groupBy })
        .then(function (rows) {
          const el = document.getElementById('report-table');
          if (!el) return;
          if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
          const cols = Object.keys(rows[0]);
          let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
          cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            cols.forEach(function (c) {
              const v = r[c];
              const val = (typeof v === 'number' && c === 'revenue') ? v.toFixed(2) : (v || '');
              tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
            });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          el.innerHTML = tbl;
        })
        .catch(function (err) {
          const el = document.getElementById('report-table');
          if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
        });
    }
    document.getElementById('report-refresh').onclick = loadReport;
    document.getElementById('report-print').onclick = function () { window.print(); };
    loadReport();
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
    const dataRoutes = DATA_ROUTES_SLUGS;
    const editMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/edit\\/(\\d+)$'));
    const newMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/new$'));
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const settingsApiKeysMatch = hash.match(/^settings\/apikeys$/);
    const settingsTotpMatch = hash.match(/^settings\/totp$/);
    const settingsDashboardMatch = hash.match(/^settings\/dashboard-widgets$/);
    const settingsIndexMatch = hash.match(/^settings\/?$/);
    const discussMatch = hash.match(/^discuss$/);
    const discussChannelMatch = hash.match(/^discuss\/(\d+)$/);
    const reportsTrialMatch = hash.match(/^reports\/trial-balance$/);
    const reportsPLMatch = hash.match(/^reports\/profit-loss$/);
    const reportsBSMatch = hash.match(/^reports\/balance-sheet$/);
    const reportsStockValMatch = hash.match(/^reports\/stock-valuation$/);
    const reportsSalesRevMatch = hash.match(/^reports\/sales-revenue$/);
    const genericEditMatch = hash.match(/^([a-z0-9_/-]+)\/edit\/(\d+)$/i);
    const genericNewMatch = hash.match(/^([a-z0-9_/-]+)\/new$/i);
    const genericListMatch = base.match(/^([a-z0-9_/-]+)$/i);

    if (reportsTrialMatch) {
      renderAccountingReport('trial-balance', 'Trial Balance');
    } else if (reportsPLMatch) {
      renderAccountingReport('profit-loss', 'Profit & Loss');
    } else if (reportsBSMatch) {
      renderAccountingReport('balance-sheet', 'Balance Sheet');
    } else if (reportsStockValMatch) {
      renderStockValuationReport();
    } else if (reportsSalesRevMatch) {
      renderSalesRevenueReport();
    } else if (discussMatch || discussChannelMatch) {
      renderDiscuss(discussChannelMatch ? discussChannelMatch[1] : null);
    } else if (base === 'website') {
      renderAppShellPlaceholder(
        'website',
        'Website',
        'Website pages and editor are scaffolded in modules; open Products for catalogue data, or Home.',
        { secondaryActionLabel: 'Open Products', secondaryHash: 'products' }
      );
    } else if (base === 'ecommerce') {
      renderAppShellPlaceholder(
        'ecommerce',
        'eCommerce',
        'Shop flows are partially scaffolded. Use Products, Sale Orders, or Invoicing for catalogue and orders.',
        { secondaryActionLabel: 'Open Sale Orders', secondaryHash: 'orders' }
      );
    } else if (settingsApiKeysMatch) {
      renderApiKeysSettings();
    } else if (settingsTotpMatch) {
      renderTotpSettings();
    } else if (settingsDashboardMatch) {
      renderDashboardWidgets();
    } else if (settingsIndexMatch) {
      renderSettings();
    } else if (listMatch) {
      const route = listMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        dispatchActWindowForListRoute(route, { source: 'routeApplyList' });
        loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, getHashDomainParam());
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (newMatch) {
      const route = newMatch[1];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (editMatch) {
      const route = editMatch[1], id = editMatch[2];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route, id);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericListMatch) {
      const route = genericListMatch[1];
      const model = getModelForRoute(route);
      if (model) {
        dispatchActWindowForListRoute(route, { source: 'routeApplyList' });
        loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, getHashDomainParam());
      }
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericNewMatch) {
      const route = genericNewMatch[1];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else if (genericEditMatch) {
      const route = genericEditMatch[1], id = genericEditMatch[2];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route, id);
      else if (window.__ERP_STRICT_ROUTING) renderUnknownRoutePlaceholder(route);
      else renderHome();
    } else {
      renderHome();
    }
  }

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
    buildSearchDomain: buildSearchDomain, getHashDomainParam: function () { return getHashDomainParam.apply(null, arguments); },
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
      main.innerHTML = '<h2>Unable to load</h2><p style="color:var(--text-muted);margin:1rem 0">' +
        (err && err.message ? String(err.message).replace(/</g, '&lt;') : 'Network or server error') + '</p>' +
        '<p><a href="/web/login" style="color:var(--color-primary)">Go to login</a> &middot; <a href="javascript:location.reload()" style="color:var(--color-primary)">Retry</a></p>';
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
