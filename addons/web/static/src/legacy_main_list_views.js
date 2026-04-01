/**
 * @deprecated Track O3 — This module is scheduled for retirement once the OWL
 * ListController (Track J2) is fully wired via ActionContainer (Track O2).
 * Do NOT add new functionality here. Migrate logic to
 * app/views/list/list_controller.js and app/search/with_search.js.
 *
 * Legacy web.assets_web: list view rendering + record loading + saved filters.
 * Loaded before main.js; sets window.__ERP_LIST_VIEWS (Phase 1.245 Track D2).
 */
(function () {
  'use strict';

  var LV = (window.__ERP_LIST_VIEWS = window.__ERP_LIST_VIEWS || {});

  var _installed = false;
  var _rpc = null;
  var _viewsSvc = null;
  var _showToast = null;
  var _main = null;

  var _getMany2oneComodel = null;
  var _getMany2manyInfo = null;
  var _isMonetaryField = null;
  var _getMonetaryCurrencyField = null;
  var _getSelectionLabel = null;
  var _getFieldMeta = null;
  var _getSelectionOptions = null;

  var _getListColumns = null;
  var _getTitle = null;
  var _getReportName = null;

  var _getActionForRoute = null;
  var _parseActionDomain = null;
  var _parseFilterDomain = null;
  var _buildSearchDomain = null;
  var _getHashDomainParam = null;

  var _showImportModal = null;
  var _confirmModal = null;
  var _saveSavedFilterCtx = null;

  var _getAvailableViewModesCtx = null;
  var _setViewAndReloadCtx = null;

  var _loadRecordsCtx = null;
  var _dispatchActWindowForListRoute = null;
  var _dispatchListActWindowThenFormHash = null;
  var _applyActionStackForList = null;
  var _renderViewSwitcherCtx = null;
  var _attachActWindowFormLinkDelegation = null;
  var _actionToRoute = null;
  var _skeletonHtml = null;

  var currentListState = {
    model: null,
    route: null,
    searchTerm: '',
    stageFilter: null,
    viewType: null,
    savedFilterId: null,
    offset: 0,
    limit: 80,
    order: null,
    totalCount: 0,
    activeSearchFilters: [],
    groupBy: null
  };

  // ─── install ──────────────────────────────────────────────────────────

  LV.install = function (ctx) {
    if (_installed) return;
    _installed = true;

    _rpc = ctx.rpc;
    _viewsSvc = ctx.viewsSvc;
    _showToast = ctx.showToast;
    _main = ctx.main;

    _getMany2oneComodel = ctx.getMany2oneComodel;
    _getMany2manyInfo = ctx.getMany2manyInfo;
    _isMonetaryField = ctx.isMonetaryField;
    _getMonetaryCurrencyField = ctx.getMonetaryCurrencyField;
    _getSelectionLabel = ctx.getSelectionLabel;
    _getFieldMeta = ctx.getFieldMeta;
    _getSelectionOptions = ctx.getSelectionOptions;

    _getListColumns = ctx.getListColumns;
    _getTitle = ctx.getTitle;
    _getReportName = ctx.getReportName;

    _getActionForRoute = ctx.getActionForRoute;
    _parseActionDomain = ctx.parseActionDomain;
    _parseFilterDomain = ctx.parseFilterDomain;
    _buildSearchDomain = ctx.buildSearchDomain;
    _getHashDomainParam = ctx.getHashDomainParam || getHashDomainFromHash;

    _showImportModal = ctx.showImportModal;
    _confirmModal = ctx.confirmModal;
    _saveSavedFilterCtx = ctx.saveSavedFilter;

    _getAvailableViewModesCtx = ctx.getAvailableViewModes;
    _setViewAndReloadCtx = ctx.setViewAndReload;

    _loadRecordsCtx = ctx.loadRecords;
    _dispatchActWindowForListRoute = ctx.dispatchActWindowForListRoute;
    _dispatchListActWindowThenFormHash = ctx.dispatchListActWindowThenFormHash;
    _applyActionStackForList = ctx.applyActionStackForList;
    _renderViewSwitcherCtx = ctx.renderViewSwitcher;
    _attachActWindowFormLinkDelegation = ctx.attachActWindowFormLinkDelegation;
    _actionToRoute = ctx.actionToRoute;
    _skeletonHtml = ctx.skeletonHtml;
  };

  // ─── display name resolution ──────────────────────────────────────────

  function getDisplayNames(model, colName, records) {
    if (records && records.length && records[0][colName + '_display'] !== undefined) {
      var map = {};
      records.forEach(function (r) {
        var v = r[colName];
        if (v && !map[v]) map[v] = r[colName + '_display'] || v;
      });
      return Promise.resolve(map);
    }
    var comodel = _getMany2oneComodel(model, colName);
    if (!comodel) return Promise.resolve({});
    var ids = [];
    records.forEach(function (r) {
      var v = r[colName];
      if (v) ids.push(v);
    });
    if (!ids.length) return Promise.resolve({});
    var uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var map = {};
    return _rpc.callKw(comodel, 'read', [uniq, ['id', 'name', 'display_name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          map[row.id] = row.display_name || row.name || row.id;
        });
        return map;
      })
      .catch(function () { return {}; });
  }

  function getDisplayNamesForMany2many(model, colName, records) {
    var m2m = _getMany2manyInfo(model, colName);
    if (!m2m || !m2m.comodel) return Promise.resolve({});
    var ids = [];
    records.forEach(function (r) {
      var v = r[colName];
      if (Array.isArray(v)) v.forEach(function (id) { ids.push(id); });
    });
    if (!ids.length) return Promise.resolve({});
    var uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var map = {};
    return _rpc.callKw(m2m.comodel, 'read', [uniq, ['id', 'name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  // ─── view switcher ───────────────────────────────────────────────────

  function renderViewSwitcher(route, currentView) {
    var ListViewCore = window.AppCore && window.AppCore.ListView;
    if (ListViewCore && typeof ListViewCore.renderViewSwitcher === 'function') {
      return ListViewCore.renderViewSwitcher(route, currentView, {
        getAvailableViewModes: getAvailableViewModes
      });
    }
    var modes = getAvailableViewModes(route).filter(function (m) {
      return m === 'list' || m === 'kanban' || m === 'graph' ||
             m === 'calendar' || m === 'activity' || m === 'pivot' || m === 'gantt';
    });
    if (modes.length < 2) return '';
    var labels = {
      list: 'List', kanban: 'Kanban', graph: 'Graph',
      pivot: 'Pivot', calendar: 'Calendar', activity: 'Activity', gantt: 'Gantt'
    };
    var html = '<span class="view-switcher o-list-view-switcher">';
    modes.forEach(function (m) {
      var active = m === currentView;
      html += '<button type="button" class="btn-view' +
        (active ? ' active' : '') + '" data-view="' + m + '">' +
        (labels[m] || m) + '</button>';
    });
    return html + '</span>';
  }

  // ─── renderList ───────────────────────────────────────────────────────

  function renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    var prevSearchModel = currentListState.__searchModel;
    var prevListModel = prevSearchModel && prevSearchModel.model;
    if (!prevSearchModel || prevListModel !== model) {
      if (prevListModel != null && prevListModel !== model) {
        currentListState.facets = [];
        currentListState._facetsDefaultsApplied = false;
      }
      if (window.AppCore && window.AppCore.SearchModel) {
        currentListState.__searchModel = new window.AppCore.SearchModel(model, _viewsSvc, currentListState);
      } else {
        currentListState.__searchModel = null;
      }
    }

    var helpers = {
      getAvailableViewModes: getAvailableViewModes,
      getListColumns: _getListColumns,
      getTitle: _getTitle,
      getReportName: _getReportName,
      loadRecords: loadRecords,
      setViewAndReload: setViewAndReload,
      deleteRecord: deleteRecord,
      getMany2oneComodel: _getMany2oneComodel,
      getMany2manyInfo: _getMany2manyInfo,
      isMonetaryField: _isMonetaryField,
      getMonetaryCurrencyField: _getMonetaryCurrencyField,
      getSelectionLabel: _getSelectionLabel,
      getDisplayNames: getDisplayNames,
      getDisplayNamesForMany2many: getDisplayNamesForMany2many,
      getActionForRoute: _getActionForRoute,
      parseActionDomain: _parseActionDomain,
      buildSearchDomain: _buildSearchDomain,
      parseFilterDomain: _parseFilterDomain,
      saveSavedFilter: saveSavedFilter,
      showImportModal: _showImportModal,
      getHashDomainParam: _getHashDomainParam,
      confirmModal: _confirmModal,
      getFieldMeta: _getFieldMeta,
      getSelectionOptions: _getSelectionOptions,
      saveListState: window.ActionManager && window.ActionManager.saveListState
        ? window.ActionManager.saveListState : null,
      restoreListState: window.ActionManager && window.ActionManager.restoreListState
        ? window.ActionManager.restoreListState : null
    };

    var ListViewCore = window.AppCore && window.AppCore.ListView;
    if (ListViewCore && typeof ListViewCore.render === 'function') {
      _applyActionStackForList(route, _getTitle(route));
      ListViewCore.render(_main, {
        rpc: _rpc,
        viewsSvc: _viewsSvc,
        showToast: _showToast,
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        totalCount: totalCount,
        offset: offset,
        limit: limit,
        searchModel: currentListState.__searchModel,
        savedFiltersList: savedFiltersList,
        currentListState: currentListState,
        helpers: helpers
      });
      return;
    }

    var _lvm = window.AppCore && window.AppCore.ListViewModule;
    if (_lvm && typeof _lvm.render === 'function') {
      var extHelpers = {};
      for (var k in helpers) { extHelpers[k] = helpers[k]; }
      extHelpers.applyActionStackForList = _applyActionStackForList;
      extHelpers.renderViewSwitcher = renderViewSwitcher;
      extHelpers.dispatchListActWindowThenFormHash = _dispatchListActWindowThenFormHash;

      _lvm.render(_main, {
        rpc: _rpc,
        viewsSvc: _viewsSvc,
        showToast: _showToast,
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        totalCount: totalCount,
        offset: offset,
        limit: limit,
        savedFiltersList: savedFiltersList,
        currentListState: currentListState,
        searchModel: currentListState.__searchModel,
        helpers: extHelpers
      });
      return;
    }

    _main.innerHTML = '<p class="o-empty">List view unavailable.</p>';
  }

  // ─── deleteRecord ─────────────────────────────────────────────────────

  function deleteRecord(model, route, id) {
    _rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(function () {
        _showToast('Record deleted', 'success');
        loadRecords(model, route, currentListState.searchTerm);
      })
      .catch(function (err) {
        _showToast(err.message || 'Failed to delete', 'error');
      });
  }

  // ─── saved filters ───────────────────────────────────────────────────

  function getSavedFiltersFromStorage(model) {
    try {
      var raw = localStorage.getItem('erp_saved_filters_' + (model || '').replace(/\./g, '_'));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function getSavedFilters(model) {
    var sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) return Promise.resolve(getSavedFiltersFromStorage(model));
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) return getSavedFiltersFromStorage(model);
      var domain = [['model_id', '=', model || ''], '|', ['user_id', '=', false], ['user_id', '=', info.uid]];
      return _rpc.callKw('ir.filters', 'search_read', [domain], { fields: ['id', 'name', 'domain'], limit: 100 })
        .then(function (rows) {
          return (rows || []).map(function (r) {
            var dom = [];
            try { dom = r.domain ? JSON.parse(r.domain) : []; } catch (e) { /* noop */ }
            return { id: r.id, name: r.name || 'Filter', domain: dom };
          });
        })
        .catch(function () { return getSavedFiltersFromStorage(model); });
    }).catch(function () { return getSavedFiltersFromStorage(model); });
  }

  function saveSavedFilter(model, name, domain) {
    var sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      var key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      var filters = getSavedFiltersFromStorage(model);
      var id = 'f' + Date.now();
      filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) { /* noop */ }
      return Promise.resolve(id);
    }
    return sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        var key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        var filters = getSavedFiltersFromStorage(model);
        var id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) { /* noop */ }
        return id;
      }
      return _rpc.callKw('ir.filters', 'create', [{
        name: name || 'Filter',
        model_id: model || '',
        domain: JSON.stringify(domain || []),
        user_id: info.uid
      }], {}).then(function (rec) {
        if (!rec) return null;
        if (Array.isArray(rec) && rec.length) return rec[0];
        return rec.ids ? rec.ids[0] : (rec.id != null ? rec.id : null);
      }).catch(function () {
        var key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
        var filters = getSavedFiltersFromStorage(model);
        var id = 'f' + Date.now();
        filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
        try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) { /* noop */ }
        return id;
      });
    });
  }

  function removeSavedFilter(model, id) {
    if (typeof id === 'string' && id.indexOf('f') === 0) {
      var key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      var filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) { /* noop */ }
      return Promise.resolve();
    }
    return _rpc.callKw('ir.filters', 'unlink', [[parseInt(id, 10)]], {}).catch(function () {
      var key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
      var filters = getSavedFiltersFromStorage(model).filter(function (f) { return f.id !== id; });
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) { /* noop */ }
    });
  }

  // ─── hash / view helpers ──────────────────────────────────────────────

  function getHashViewParam() {
    var hash = (window.location.hash || '').slice(1);
    var q = hash.indexOf('?');
    if (q < 0) return null;
    var params = new URLSearchParams(hash.slice(q + 1));
    return params.get('view') || null;
  }

  function getHashDomainFromHash() {
    var hash = (window.location.hash || '').slice(1);
    var q = hash.indexOf('?');
    if (q < 0) return [];
    var params = new URLSearchParams(hash.slice(q + 1));
    var raw = params.get('domain');
    if (!raw || !_parseActionDomain) return [];
    var parsed = _parseActionDomain(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [];
  }

  function getAvailableViewModes(route) {
    if (!_viewsSvc) return ['list'];
    var menus = _viewsSvc.getMenus() || [];
    for (var i = 0; i < menus.length; i++) {
      var action = menus[i].action ? _viewsSvc.getAction(menus[i].action) : null;
      if (action && _actionToRoute(action) === route) {
        var raw = action.view_mode || action.viewMode || 'list,form';
        var modes = Array.isArray(raw) ? raw : String(raw).split(/[,\s]+/).filter(Boolean);
        return modes.length ? modes : ['list'];
      }
    }
    return ['list'];
  }

  function getPreferredViewType(route) {
    var urlView = getHashViewParam();
    if (urlView) return urlView;
    try {
      var stored = sessionStorage.getItem('view_' + route);
      if (stored) return stored;
    } catch (e) { /* noop */ }
    var modes = getAvailableViewModes(route);
    return modes[0] || 'list';
  }

  function setViewAndReload(route, view) {
    try {
      sessionStorage.setItem('view_' + route, view);
    } catch (e) { /* noop */ }
    _dispatchActWindowForListRoute(route, { source: 'listViewSwitch' });
    window.location.hash = route + (view && view !== 'list' ? '?view=' + view : '');
  }

  // ─── loadRecords (core data-fetch + dispatch) ─────────────────────────
  /** Bounded wait for list RPC (search_count + search_read); avoids perpetual skeleton on hung TCP/DB. */
  var LIST_SEARCH_RPC_DEADLINE_MS = 25000;

  function renderListLoadFailure(title, err, retryFn) {
    var msg = err && err.message ? String(err.message).replace(/</g, '&lt;') : 'Failed to load';
    _main.innerHTML =
      '<h2>' + title + '</h2>' +
      '<p class="error o-list-load-error">' + msg + '</p>' +
      '<div class="o-list-load-retry-wrap"><button type="button" class="o-btn o-btn-primary" id="o-list-load-retry">Retry</button></div>';
    var retryBtn = document.getElementById('o-list-load-retry');
    if (retryBtn && typeof retryFn === 'function') {
      retryBtn.onclick = function () { retryFn(); };
    }
  }

  function loadRecords(model, route, searchTerm, stageFilter, viewTypeOverride, savedFilterId, offsetOverride, orderOverride, domainOverride) {
    var viewType = viewTypeOverride != null ? viewTypeOverride : getPreferredViewType(route);

    var cols = _getListColumns(model);
    var fnames = cols.map(function (c) { return typeof c === 'object' ? c.name : c; });
    var fields = ['id'].concat(fnames);
    fnames.forEach(function (f) {
      var cf = _getMonetaryCurrencyField(model, f);
      if (cf && fields.indexOf(cf) < 0) fields.push(cf);
    });

    var title = _getTitle(route);

    if (stageFilter === undefined && currentListState.route === route) {
      stageFilter = currentListState.stageFilter;
    }
    if (savedFilterId === undefined && currentListState.route === route) {
      savedFilterId = currentListState.savedFilterId;
    }

    var offset = offsetOverride != null
      ? offsetOverride
      : (currentListState.route === route ? (currentListState.offset || 0) : 0);
    var limit = currentListState.limit || 80;
    var order = orderOverride != null
      ? orderOverride
      : (currentListState.route === route ? currentListState.order : null);

    var action = _getActionForRoute(route);
    var actionDomain = (domainOverride && domainOverride.length)
      ? domainOverride
      : (action ? _parseActionDomain(action.domain || '') : []);
    var domainOverrideProvided = !!(domainOverride && domainOverride.length);

    var prevCal = (viewType === 'calendar' && currentListState.route === route)
      ? { calendarYear: currentListState.calendarYear, calendarMonth: currentListState.calendarMonth }
      : {};
    var prevFilters = (currentListState.route === route)
      ? { activeSearchFilters: currentListState.activeSearchFilters || [], groupBy: currentListState.groupBy }
      : {};

    currentListState = Object.assign(
      {
        model: model,
        route: route,
        searchTerm: searchTerm || '',
        stageFilter: stageFilter,
        viewType: viewType,
        savedFilterId: savedFilterId || null,
        offset: offset,
        limit: limit,
        order: order,
        totalCount: 0,
        activeSearchFilters: [],
        groupBy: null
      },
      prevCal,
      prevFilters
    );

    var skeleton = _skeletonHtml ? _skeletonHtml(6, true) : '<p style="color:var(--text-muted)">Loading...</p>';
    _main.innerHTML = '<h2>' + title + '</h2>' + skeleton;

    var sessionSvc = window.Services && window.Services.session;
    var uidPromise = sessionSvc && sessionSvc.getSessionInfo
      ? sessionSvc.getSessionInfo()
          .then(function (info) { return info && info.uid ? info.uid : 1; })
          .catch(function () { return 1; })
      : Promise.resolve(1);

    uidPromise.then(function (uid) {
      return getSavedFilters(model).then(function (savedFilters) {
        var domain = actionDomain.slice();

        var savedFilter = savedFilterId
          ? savedFilters.find(function (f) { return f.id == savedFilterId; })
          : null;
        if (savedFilter && savedFilter.domain && savedFilter.domain.length) {
          domain = domain.concat(savedFilter.domain);
        } else {
          if (!domainOverrideProvided) {
            var searchDom = _buildSearchDomain(model, searchTerm && searchTerm.trim() ? searchTerm.trim() : '');
            if (searchDom.length) domain = domain.concat(searchDom);
          }
          if (model === 'crm.lead' && stageFilter) {
            domain = domain.concat([['stage_id', '=', stageFilter]]);
          }
        }

        var searchView = _viewsSvc && _viewsSvc.getView(model, 'search');
        var filters = (searchView && searchView.filters) || [];
        (currentListState.activeSearchFilters || []).forEach(function (fname) {
          var f = filters.find(function (x) { return x.name === fname && x.domain; });
          if (f && f.domain) {
            var fd = _parseFilterDomain(f.domain, uid);
            if (fd.length) domain = domain.concat(fd);
          }
        });

        // Delegate to chart/special view renderers via __ERP_CHART_VIEWS
        var CV = window.__ERP_CHART_VIEWS || {};

        if (viewType === 'graph' && _viewsSvc && _viewsSvc.getView(model, 'graph')) {
          if (CV.loadGraphData) {
            CV.loadGraphData(model, route, domain, searchTerm, savedFilters);
          }
          return Promise.resolve();
        }

        if (viewType === 'pivot' && _viewsSvc && _viewsSvc.getView(model, 'pivot')) {
          if (CV.loadPivotData) {
            CV.loadPivotData(model, route, domain, searchTerm, savedFilters);
          }
          return Promise.resolve();
        }

        if (viewType === 'activity' && (model === 'crm.lead' || model === 'project.task')) {
          if (CV.loadActivityData) {
            CV.loadActivityData(model, route, domain, searchTerm, savedFilters);
          }
          return Promise.resolve();
        }

        if (viewType === 'gantt' && (model === 'project.task' || model === 'mrp.production')) {
          if (CV.loadGanttData) {
            CV.loadGanttData(model, route, domain, searchTerm, savedFilters);
          }
          return Promise.resolve();
        }

        var searchReadKw = { fields: fields, offset: offset, limit: limit };
        var effectiveOrder = order || (currentListState.groupBy ? currentListState.groupBy : null);
        if (effectiveOrder) searchReadKw.order = effectiveOrder;

        var searchReadPromise = _rpc.callKw(model, 'search_read', [domain], searchReadKw);
        var searchCountPromise = _rpc.callKw(model, 'search_count', [domain], {})
          .catch(function () { return null; });

        var rpcCombined = Promise.all([searchCountPromise, searchReadPromise]);
        var deadlineReject = new Promise(function (_, rej) {
          setTimeout(function () {
            rej(new Error('List data request timed out. Check your connection or try again.'));
          }, LIST_SEARCH_RPC_DEADLINE_MS);
        });
        return Promise.race([rpcCombined, deadlineReject]).then(function (results) {
          var totalCount = results[0] != null ? results[0] : (results[1].length + offset);
          var records = results[1];
          currentListState.totalCount = totalCount;

          if (viewType === 'kanban' && window.ViewRenderers && window.ViewRenderers.kanban) {
            if (CV.renderKanban) {
              CV.renderKanban(model, route, records, searchTerm);
            }
          } else if (viewType === 'calendar' && model === 'crm.lead') {
            if (CV.renderCalendar) {
              CV.renderCalendar(model, route, records, searchTerm);
            }
          } else {
            renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFilters);
          }
        });
      });
    }).catch(function (err) {
      renderListLoadFailure(title, err, function () {
        loadRecords(model, route, searchTerm, stageFilter, viewTypeOverride, savedFilterId, offsetOverride, orderOverride, domainOverride);
      });
    });
  }

  // ─── public API ───────────────────────────────────────────────────────

  LV.getCurrentListState = function () {
    return currentListState;
  };

  LV.setCurrentListState = function (s) {
    currentListState = s;
  };

  LV.getDisplayNames = getDisplayNames;
  LV.getDisplayNamesForMany2many = getDisplayNamesForMany2many;
  LV.renderViewSwitcher = renderViewSwitcher;
  LV.renderList = renderList;
  LV.deleteRecord = deleteRecord;
  LV.loadRecords = loadRecords;

  LV.getHashViewParam = getHashViewParam;
  LV.getAvailableViewModes = getAvailableViewModes;
  LV.getPreferredViewType = getPreferredViewType;
  LV.setViewAndReload = setViewAndReload;

  LV.getSavedFilters = getSavedFilters;
  LV.saveSavedFilter = saveSavedFilter;
  LV.removeSavedFilter = removeSavedFilter;
  LV.getSavedFiltersFromStorage = getSavedFiltersFromStorage;
})();
