/**
 * Legacy web.assets_web: graph / pivot / calendar / kanban / gantt / activity views.
 * Loaded before main.js; sets window.__ERP_CHART_VIEWS (Phase 1.245 Track D3).
 */
(function () {
  'use strict';

  var CV = (window.__ERP_CHART_VIEWS = window.__ERP_CHART_VIEWS || {});

  var _installed = false;
  var _ctx = null;

  var GraphViewCore = window.AppCore && window.AppCore.GraphView ? window.AppCore.GraphView : null;
  var PivotViewCore = window.AppCore && window.AppCore.PivotView ? window.AppCore.PivotView : null;
  var CalendarViewCore = window.AppCore && window.AppCore.CalendarView ? window.AppCore.CalendarView : null;
  var GanttViewCore = window.AppCore && window.AppCore.GanttView ? window.AppCore.GanttView : null;
  var ActivityViewCore = window.AppCore && window.AppCore.ActivityView ? window.AppCore.ActivityView : null;

  function _rpc() { return _ctx && _ctx.rpc; }
  function _viewsSvc() { return _ctx && _ctx.viewsSvc; }
  function _showToast(msg, type) { if (_ctx && _ctx.showToast) _ctx.showToast(msg, type); }
  function _main() { return _ctx && _ctx.main; }
  function _getTitle(route) { return (_ctx && _ctx.getTitle) ? _ctx.getTitle(route) : route; }
  function _renderViewSwitcher(route, currentView) {
    if (_ctx && _ctx.renderViewSwitcher) return _ctx.renderViewSwitcher(route, currentView);
    var LV = window.__ERP_LIST_VIEWS;
    if (LV && typeof LV.renderViewSwitcher === 'function') return LV.renderViewSwitcher(route, currentView);
    return '';
  }
  function _loadRecords() {
    if (_ctx && _ctx.loadRecords) return _ctx.loadRecords;
    var LV = window.__ERP_LIST_VIEWS;
    if (LV && typeof LV.loadRecords === 'function') return LV.loadRecords;
    return function () {};
  }
  function _dispatchListActWindowThenFormHash(route, suffix, source) {
    if (_ctx && _ctx.dispatchListActWindowThenFormHash) _ctx.dispatchListActWindowThenFormHash(route, suffix, source);
  }
  function _setViewAndReload(route, view) {
    if (_ctx && _ctx.setViewAndReload) _ctx.setViewAndReload(route, view);
  }
  function _attachActWindowFormLinkDelegation(sel, route, source) {
    if (_ctx && _ctx.attachActWindowFormLinkDelegation) _ctx.attachActWindowFormLinkDelegation(sel, route, source);
  }
  function _buildSearchDomain(model, term) {
    if (_ctx && _ctx.buildSearchDomain) return _ctx.buildSearchDomain(model, term);
    return [];
  }
  function _getCurrentListState() {
    if (_ctx && _ctx.getCurrentListState) return _ctx.getCurrentListState();
    return {};
  }
  function _setCurrentListState(s) {
    if (_ctx && _ctx.setCurrentListState) _ctx.setCurrentListState(s);
  }
  function _getActionStack() {
    if (_ctx && _ctx.getActionStack) return _ctx.getActionStack();
    return [];
  }
  function _setActionStack(s) {
    if (_ctx && _ctx.setActionStack) _ctx.setActionStack(s);
  }

  // ── Activity ────────────────────────────────────────────────────────────

  function loadActivityData(model, route, domain, searchTerm, savedFiltersList) {
    var main = _main();
    var rpc = _rpc();
    var sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>Session required for activity view.</p>';
      return;
    }
    sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>Please log in.</p>';
        return;
      }
      var searchDom = _buildSearchDomain(model, searchTerm || '');
      var fullDomain = (domain || []).concat(searchDom || []);
      var fields = model === 'crm.lead'
        ? ['id', 'name', 'stage_id', 'ai_score_label', 'expected_revenue']
        : (model === 'helpdesk.ticket'
          ? ['id', 'name', 'stage_id']
          : ['id', 'name', 'project_id', 'stage_id']);
      return Promise.all([
        rpc.callKw('mail.activity.type', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' }),
        rpc.callKw(model, 'search_read', [fullDomain], { fields: fields, limit: 50 }),
        rpc.callKw('mail.activity', 'search_read', [[['res_model', '=', model]]], {
          fields: ['id', 'res_id', 'summary', 'date_deadline', 'state', 'activity_type_id'],
          limit: 500
        })
      ]).then(function (results) {
        var types = results[0] || [];
        var records = results[1] || [];
        var activities = results[2] || [];
        renderActivityMatrix(model, route, records, types, activities, searchTerm, savedFiltersList || [], info.uid);
      });
    }).catch(function () {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p class="error o-list-load-error">Failed to load activities.</p>';
    });
  }

  // ── Gantt ───────────────────────────────────────────────────────────────

  function loadGanttData(model, route, domain, searchTerm, savedFiltersList) {
    var main = _main();
    var rpc = _rpc();
    var searchDom = _buildSearchDomain(model, searchTerm || '');
    var fullDomain = (domain || []).concat(searchDom || []);
    var dateStart = model === 'project.task' ? 'date_start' : 'date_start';
    var dateStop = model === 'project.task' ? 'date_deadline' : 'date_finished';
    var groupBy = model === 'project.task' ? 'project_id' : 'state';
    var fields = ['id', 'name', dateStart, dateStop, groupBy];
    rpc.callKw(model, 'search_read', [fullDomain], { fields: fields, limit: 200 })
      .then(function (records) {
        renderGanttView(model, route, records, searchTerm, savedFiltersList || [], dateStart, dateStop, groupBy);
      })
      .catch(function () {
        main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p class="error o-list-load-error">Failed to load Gantt data.</p>';
      });
  }

  function renderGanttView(model, route, records, searchTerm, savedFiltersList, dateStart, dateStop, groupBy) {
    var main = _main();
    if (GanttViewCore && typeof GanttViewCore.render === 'function') {
      var coreHandled = GanttViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
        searchTerm: searchTerm || '',
      });
      if (coreHandled) return;
    }
    var mod = window.AppCore && window.AppCore.GanttViewModule;
    if (mod && typeof mod.render === 'function') {
      var ok = mod.render(main, {
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        dateStart: dateStart,
        dateStop: dateStop,
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        loadRecords: _loadRecords(),
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        setViewAndReload: _setViewAndReload,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
        attachActWindowFormLinkDelegation: _attachActWindowFormLinkDelegation,
      });
      if (ok) return;
    }
    renderGanttViewFallback(model, route, records, searchTerm, savedFiltersList, dateStart, dateStop, groupBy);
  }

  function renderGanttViewFallback(model, route, records, searchTerm, savedFiltersList, dateStart, dateStop, groupBy) {
    var main = _main();
    var title = _getTitle(route);
    var currentView = 'gantt';
    var addLabel = route === 'tasks' ? 'Add task' : route === 'manufacturing' ? 'Add MO' : 'Add';
    _setActionStack([{ label: title, hash: route }]);
    var html = '<h2>' + title + '</h2>';
    html += '<p class="o-gantt-fallback-toolbar">';
    html += _renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-gantt-fallback-search"><input type="text" id="list-search" placeholder="Search..." class="o-list-search-field" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + '</button></p>';
    var now = new Date();
    var rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    var totalDays = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000));
    var dayWidth = 24;
    var timelineWidth = totalDays * dayWidth;
    html += '<div class="gantt-view o-gantt-scroll"><table role="grid" class="o-gantt-table"><thead><tr><th class="o-gantt-th o-gantt-th--name">Name</th><th class="o-gantt-th o-gantt-th--timeline" style="min-width:' + timelineWidth + 'px">' + rangeStart.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) + ' – ' + rangeEnd.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) + '</th></tr></thead><tbody>';
    (records || []).forEach(function (r) {
      var startVal = r[dateStart];
      var stopVal = r[dateStop];
      var startDate = startVal ? new Date(startVal) : rangeStart;
      var stopDate = stopVal ? new Date(stopVal) : (startVal ? new Date(startVal) : rangeEnd);
      var left = Math.max(0, Math.floor((startDate - rangeStart) / (24 * 60 * 60 * 1000)) * dayWidth);
      var width = Math.max(dayWidth, Math.ceil((stopDate - startDate) / (24 * 60 * 60 * 1000)) * dayWidth);
      var name = (r.name || '\u2014').replace(/</g, '&lt;');
      html += '<tr><td class="o-gantt-td o-gantt-td--name"><a href="#' + route + '/edit/' + (r.id || '') + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || '') + '">' + name + '</a></td><td class="o-gantt-td o-gantt-td--timeline" style="min-width:' + timelineWidth + 'px"><div class="o-gantt-bar" style="left:' + left + 'px;width:' + width + 'px" title="' + String(startVal || '').replace(/"/g, '&quot;') + ' \u2013 ' + String(stopVal || '').replace(/"/g, '&quot;') + '"></div></td></tr>';
    });
    html += '</tbody></table></div>';
    if (!records || !records.length) {
      html = html.replace('</div>', '<p class="o-gantt-empty">No records with dates.</p></div>');
    }
    main.innerHTML = html;
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', viewType: 'gantt' });
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'viewChromeToolbarNew'); };
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () { _loadRecords()(model, route, searchInput.value.trim(), null, 'gantt', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    _attachActWindowFormLinkDelegation('.o-gantt-scroll', route, 'ganttNameEditLink');
  }

  // ── Activity Matrix ─────────────────────────────────────────────────────

  function renderActivityMatrix(model, route, records, activityTypes, activities, searchTerm, savedFiltersList, userId) {
    var main = _main();
    if (ActivityViewCore && typeof ActivityViewCore.render === 'function') {
      var coreHandled = ActivityViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
        activityTypes: activityTypes || [],
      });
      if (coreHandled) return;
    }
    var amod = window.AppCore && window.AppCore.ActivityViewModule;
    if (amod && typeof amod.render === 'function') {
      var ok = amod.render(main, {
        model: model,
        route: route,
        records: records,
        activityTypes: activityTypes,
        activities: activities,
        searchTerm: searchTerm,
        userId: userId,
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        loadRecords: _loadRecords(),
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        setViewAndReload: _setViewAndReload,
        getListState: _getCurrentListState,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
        rpc: _rpc(),
        showToast: _showToast,
        attachActWindowFormLinkDelegation: _attachActWindowFormLinkDelegation,
      });
      if (ok) return;
    }
    renderActivityMatrixFallback(model, route, records, activityTypes, activities, searchTerm, savedFiltersList, userId);
  }

  function renderActivityMatrixFallback(model, route, records, activityTypes, activities, searchTerm, savedFiltersList, userId) {
    var main = _main();
    var rpc = _rpc();
    var title = _getTitle(route);
    var cls = _getCurrentListState();
    var stageFilter = cls.route === route ? cls.stageFilter : null;
    var currentView = 'activity';
    var addLabel = route === 'leads' ? 'Add lead' : route === 'tasks' ? 'Add task' : 'Add';
    _setActionStack([{ label: title, hash: route }]);
    var html = '<h2>' + title + '</h2>';
    html += '<p class="o-activity-matrix-toolbar">';
    html += _renderViewSwitcher(route, currentView);
    html += '<div role="search" class="o-activity-matrix-search"><input type="text" id="list-search" placeholder="Search..." aria-label="Search" class="o-list-search-field" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button></div>';
    html += '<button type="button" id="btn-add" class="o-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + addLabel + '</button></p>';
    var byRecordType = {};
    (activities || []).forEach(function (a) {
      var key = a.res_id + '_' + (a.activity_type_id || 0);
      if (!byRecordType[key]) byRecordType[key] = [];
      byRecordType[key].push(a);
    });
    html += '<div class="activity-matrix o-activity-matrix-scroll"><table role="grid" class="o-activity-matrix-table"><thead><tr role="row"><th role="columnheader" class="o-activity-matrix-th o-activity-matrix-th--record">Record</th>';
    (activityTypes || []).forEach(function (t) {
      html += '<th role="columnheader" class="o-activity-matrix-th">' + (t.name || '').replace(/</g, '&lt;') + '</th>';
    });
    html += '</tr></thead><tbody>';
    (records || []).forEach(function (r) {
      html += '<tr role="row"><td role="gridcell" class="o-activity-matrix-td o-activity-matrix-td--record"><a href="#' + route + '/edit/' + (r.id || '') + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || '') + '">' + (r.name || '\u2014').replace(/</g, '&lt;') + '</a></td>';
      (activityTypes || []).forEach(function (t) {
        var key = (r.id || '') + '_' + (t.id || 0);
        var cellActs = byRecordType[key] || [];
        var cellHtml = '';
        cellActs.forEach(function (a) {
          var d = a.date_deadline || '';
          var summary = (a.summary || 'Activity').replace(/</g, '&lt;');
          cellHtml += '<div class="o-activity-matrix-cell-line"><a href="#' + route + '/edit/' + (r.id || '') + '" class="o-erp-actwindow-form-link" data-edit-id="' + (r.id || '') + '">' + summary + (d ? ' <span class="o-activity-matrix-cell-meta">' + String(d).replace(/</g, '&lt;') + '</span>' : '') + '</a></div>';
        });
        cellHtml += '<button type="button" class="btn-schedule-activity o-activity-schedule-btn" data-record-id="' + (r.id || '') + '" data-type-id="' + (t.id || '') + '" data-type-name="' + (t.name || '').replace(/"/g, '&quot;') + '">+ Schedule</button>';
        html += '<td role="gridcell" class="o-activity-matrix-td">' + cellHtml + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    if (!records || !records.length) {
      html = html.replace('</div>', '<p class="o-activity-matrix-empty">No records.</p></div>');
    }
    main.innerHTML = html;
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'activity' });
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'viewChromeToolbarNew'); };
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () { _loadRecords()(model, route, searchInput.value.trim(), null, 'activity', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    _attachActWindowFormLinkDelegation('.o-activity-matrix-scroll', route, 'activityMatrixEditLink');
    main.querySelectorAll('.btn-schedule-activity').forEach(function (btn) {
      btn.onclick = function () {
        var recordId = parseInt(btn.getAttribute('data-record-id'), 10);
        var typeId = parseInt(btn.getAttribute('data-type-id'), 10);
        var typeName = btn.getAttribute('data-type-name') || 'Activity';
        var summary = prompt('Summary for ' + typeName + ':', typeName);
        if (summary == null) return;
        var dateStr = prompt('Due date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
        if (dateStr == null) return;
        rpc.callKw('mail.activity', 'create', [{
          res_model: model,
          res_id: recordId,
          summary: summary.trim() || typeName,
          date_deadline: dateStr || new Date().toISOString().slice(0, 10),
          activity_type_id: typeId || false,
          user_id: userId
        }], {}).then(function () {
          _showToast('Activity scheduled', 'success');
          _loadRecords()(model, route, searchTerm, null, 'activity', null, 0, null);
        }).catch(function (err) {
          _showToast(err.message || 'Failed to schedule', 'error');
        });
      };
    });
  }

  // ── Graph ───────────────────────────────────────────────────────────────

  function loadGraphData(model, route, domain, searchTerm, savedFiltersList) {
    var main = _main();
    var rpc = _rpc();
    var viewsSvc = _viewsSvc();
    var graphView = viewsSvc && viewsSvc.getView(model, 'graph');
    if (!graphView || !graphView.fields || !graphView.fields.length) {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>No graph view configured.</p>';
      return;
    }
    var rowFields = (graphView.fields || []).filter(function (f) { return f.role === 'row'; });
    var measureFields = (graphView.fields || []).filter(function (f) { return f.role === 'measure'; });
    var groupby = rowFields.map(function (f) { return f.name; });
    var fields = measureFields.map(function (f) { return f.name; });
    if (!groupby.length || !fields.length) {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>Graph view needs row and measure fields.</p>';
      return;
    }
    var rowField = rowFields[0];
    var comodel = rowField.comodel || null;
    var labelMap = {};
    rpc.callKw(model, 'read_group', [domain], { fields: fields, groupby: groupby })
      .then(function (rows) {
        var ids = (rows || []).map(function (r) { return r[groupby[0]]; }).filter(function (id) { return id; });
        if (comodel && ids.length) {
          return rpc.callKw(comodel, 'name_get', [ids])
            .then(function (pairs) {
              (pairs || []).forEach(function (p) { labelMap[p[0]] = p[1] || String(p[0]); });
              return rows;
            })
            .catch(function () { return rows; });
        }
        return Promise.resolve(rows);
      })
      .then(function (rows) {
        var labels = (rows || []).map(function (r) {
          var v = r[groupby[0]];
          return (comodel && labelMap && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
        });
        var groupLabels = {};
        (rows || []).forEach(function (r, i) {
          var v = r[groupby[0]];
          if (v != null) groupLabels[v] = labels[i];
        });
        renderGraph(model, route, graphView, rows, groupby[0], fields, groupLabels, searchTerm, savedFiltersList);
      })
      .catch(function (err) {
        main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p class="error o-list-load-error">' + (err.message || 'Failed to load graph') + '</p>';
      });
  }

  function renderGraph(model, route, graphView, rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList) {
    var main = _main();
    if (GraphViewCore && typeof GraphViewCore.render === 'function') {
      var coreHandled = GraphViewCore.render(main, {
        model: model,
        route: route,
        graphView: graphView || {},
        rows: rows || [],
      });
      if (coreHandled) return;
    }
    var gmod = window.AppCore && window.AppCore.GraphViewModule;
    if (gmod && typeof gmod.render === 'function') {
      var ok = gmod.render(main, {
        model: model,
        route: route,
        graphView: graphView,
        rows: rows,
        groupbyField: groupbyField,
        measureFields: measureFields,
        labelMap: labelMap,
        searchTerm: searchTerm,
        savedFiltersList: savedFiltersList,
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        loadRecords: _loadRecords(),
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        setViewAndReload: _setViewAndReload,
        getListState: _getCurrentListState,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
        rpc: _rpc(),
        rerenderGraph: renderGraph,
      });
      if (ok) return;
    }
    renderGraphFallback(model, route, graphView, rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList);
  }

  function renderGraphFallback(model, route, graphView, rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    var main = _main();
    var rpc = _rpc();
    var title = _getTitle(route);
    var cls = _getCurrentListState();
    var stageFilter = cls.route === route ? cls.stageFilter : null;
    var currentView = 'graph';
    _setActionStack([{ label: title, hash: route }]);
    var graphType = (graphView && graphView.graph_type) || 'bar';
    var labels = (rows || []).map(function (r) {
      var v = r[groupbyField];
      return (labelMap && v != null && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
    });
    var datasets = measureFields.map(function (m, idx) {
      var colors = ['rgba(26,26,46,0.8)', 'rgba(70,130,180,0.8)', 'rgba(34,139,34,0.8)', 'rgba(218,165,32,0.8)'];
      return {
        label: m.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
        data: (rows || []).map(function (r) { return r[m] != null ? Number(r[m]) : 0; }),
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.8', '1'),
        borderWidth: 1
      };
    });
    var html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.GraphViewChrome && typeof window.AppCore.GraphViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.GraphViewChrome.buildToolbarHtml({
        viewSwitcherHtml: _renderViewSwitcher(route, currentView),
        graphType: graphType,
        searchTerm: searchTerm || '',
        model: model,
        addLabel: route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add',
      });
    } else {
      html += '<p class="o-graph-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += _renderViewSwitcher(route, currentView);
      html += '<span class="graph-type-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
      ['bar', 'line', 'pie'].forEach(function (t) {
        var active = t === graphType;
        html += '<button type="button" class="btn-graph-type' + (active ? ' active' : '') + '" data-type="' + t + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (t.charAt(0).toUpperCase() + t.slice(1)) + '</button>';
      });
      html += '</span>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === 'crm.lead') {
        html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    }
    html += '<div class="o-graph-container">';
    html += '<canvas id="graph-canvas"></canvas>';
    html += '</div>';
    main.innerHTML = html;
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'graph' });
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    main.querySelectorAll('.btn-graph-type').forEach(function (btn) {
      btn.onclick = function () {
        graphType = btn.dataset.type;
        renderGraph(model, route, Object.assign({}, graphView, { graph_type: graphType }), rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList);
      };
    });
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'viewChromeToolbarNew'); };
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var filterEl = document.getElementById('list-stage-filter');
        var val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        _loadRecords()(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead') {
      var filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              var opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              _loadRecords()(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
            };
          });
      }
    }
    var ctx = document.getElementById('graph-canvas');
    if (!ctx || !window.Chart) {
      main.querySelector('.o-graph-container').innerHTML = '<p>Chart.js not loaded. Refresh the page.</p>';
      return;
    }
    var chartConfig = {
      type: graphType,
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: graphType !== 'pie' ? { y: { beginAtZero: true } } : {}
      }
    };
    if (graphType === 'pie' && datasets.length > 1) {
      chartConfig.data.datasets = [{
        label: measureFields[0],
        data: datasets[0].data,
        backgroundColor: datasets[0].backgroundColor,
        borderColor: datasets[0].borderColor,
        borderWidth: 1
      }];
    }
    new window.Chart(ctx, chartConfig);
  }

  // ── Pivot ───────────────────────────────────────────────────────────────

  function loadPivotData(model, route, domain, searchTerm, savedFiltersList) {
    var main = _main();
    var rpc = _rpc();
    var viewsSvc = _viewsSvc();
    var pivotView = viewsSvc && viewsSvc.getView(model, 'pivot');
    if (!pivotView || !pivotView.fields || !pivotView.fields.length) {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>No pivot view configured.</p>';
      return;
    }
    var rowFields = (pivotView.fields || []).filter(function (f) { return f.role === 'row'; });
    var colFields = (pivotView.fields || []).filter(function (f) { return f.role === 'col'; });
    var measureFields = (pivotView.fields || []).filter(function (f) { return f.role === 'measure'; });
    var rowNames = rowFields.map(function (f) { return f.name; });
    var colNames = colFields.map(function (f) { return f.name; });
    var measures = measureFields.map(function (f) { return f.name; });
    if (!rowNames.length || !colNames.length || !measures.length) {
      main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p>Pivot view needs row, col, and measure fields.</p>';
      return;
    }
    var groupby = rowNames.concat(colNames);
    rpc.callKw(model, 'read_group', [domain], { fields: measures, groupby: groupby, lazy: false })
      .then(function (rows) {
        var rowComodel = rowFields[0] && rowFields[0].comodel;
        var colComodel = colFields[0] && colFields[0].comodel;
        var rowIds = [];
        var colIds = [];
        (rows || []).forEach(function (r) {
          var rv = r[rowNames[0]];
          var cv = r[colNames[0]];
          if (rv != null && rowIds.indexOf(rv) < 0) rowIds.push(rv);
          if (cv != null && colIds.indexOf(cv) < 0) colIds.push(cv);
        });
        var rowLabelMap = {};
        var colLabelMap = {};
        var promises = [];
        if (rowComodel && rowIds.length) {
          promises.push(rpc.callKw(rowComodel, 'name_get', [rowIds]).then(function (pairs) {
            (pairs || []).forEach(function (p) { rowLabelMap[p[0]] = p[1] || String(p[0]); });
          }).catch(function () {}));
        }
        if (colComodel && colIds.length) {
          promises.push(rpc.callKw(colComodel, 'name_get', [colIds]).then(function (pairs) {
            (pairs || []).forEach(function (p) { colLabelMap[p[0]] = p[1] || String(p[0]); });
          }).catch(function () {}));
        }
        return Promise.all(promises).then(function () {
          return { rows: rows || [], rowLabelMap: rowLabelMap, colLabelMap: colLabelMap };
        });
      })
      .then(function (data) {
        renderPivot(model, route, pivotView, data.rows, rowNames, colNames, measures, data.rowLabelMap, data.colLabelMap, searchTerm, savedFiltersList);
      })
      .catch(function (err) {
        main.innerHTML = '<h2>' + _getTitle(route) + '</h2><p class="error o-list-load-error">' + (err.message || 'Failed to load pivot') + '</p>';
      });
  }

  function renderPivot(model, route, pivotView, rows, rowNames, colNames, measures, rowLabelMap, colLabelMap, searchTerm, savedFiltersList) {
    var main = _main();
    if (PivotViewCore && typeof PivotViewCore.render === 'function') {
      var coreHandled = PivotViewCore.render(main, {
        model: model,
        route: route,
        rows: rows || [],
        rowNames: rowNames || [],
        colNames: colNames || [],
        measures: measures || [],
      });
      if (coreHandled) return;
    }
    var pmod = window.AppCore && window.AppCore.PivotViewModule;
    if (pmod && typeof pmod.render === 'function') {
      var ok = pmod.render(main, {
        model: model,
        route: route,
        pivotView: pivotView,
        rows: rows,
        rowNames: rowNames,
        colNames: colNames,
        measures: measures,
        rowLabelMap: rowLabelMap,
        colLabelMap: colLabelMap,
        searchTerm: searchTerm,
        savedFiltersList: savedFiltersList,
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        loadRecords: _loadRecords(),
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        setViewAndReload: _setViewAndReload,
        getListState: _getCurrentListState,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
        rpc: _rpc(),
        rerenderPivot: renderPivot,
      });
      if (ok) return;
    }
    renderPivotFallback(model, route, pivotView, rows, rowNames, colNames, measures, rowLabelMap, colLabelMap, searchTerm, savedFiltersList);
  }

  function renderPivotFallback(model, route, pivotView, rows, rowNames, colNames, measures, rowLabelMap, colLabelMap, searchTerm, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    var main = _main();
    var rpc = _rpc();
    var title = _getTitle(route);
    var cls = _getCurrentListState();
    var stageFilter = cls.route === route ? cls.stageFilter : null;
    var rowField = rowNames[0];
    var colField = colNames[0];
    var measureField = measures[0];
    rowLabelMap = rowLabelMap || {};
    colLabelMap = colLabelMap || {};
    var rowVals = [];
    var colVals = [];
    var matrix = {};
    (rows || []).forEach(function (r) {
      var rv = r[rowField];
      var cv = r[colField];
      var val = r[measureField] != null ? Number(r[measureField]) : 0;
      if (rv != null && rowVals.indexOf(rv) < 0) rowVals.push(rv);
      if (cv != null && colVals.indexOf(cv) < 0) colVals.push(cv);
      var key = String(rv) + '_' + String(cv);
      matrix[key] = val;
    });
    var rowLabels = rowVals.map(function (v) { return rowLabelMap[v] || (v != null ? String(v) : ''); });
    var colLabels = colVals.map(function (v) { return colLabelMap[v] || (v != null ? String(v) : ''); });
    var rowTotals = {};
    var colTotals = {};
    rowVals.forEach(function (rv) { rowTotals[rv] = 0; });
    colVals.forEach(function (cv) { colTotals[cv] = 0; });
    rowVals.forEach(function (rv) {
      colVals.forEach(function (cv) {
        var key = String(rv) + '_' + String(cv);
        var v = matrix[key] || 0;
        rowTotals[rv] += v;
        colTotals[cv] += v;
      });
    });
    var grandTotal = 0;
    Object.keys(matrix).forEach(function (k) { grandTotal += matrix[k]; });
    _setActionStack([{ label: title, hash: route }]);
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'pivot' });
    var pivotAddLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    var html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.PivotViewChrome && typeof window.AppCore.PivotViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.PivotViewChrome.buildToolbarHtml({
        viewSwitcherHtml: _renderViewSwitcher(route, 'pivot'),
        searchTerm: searchTerm || '',
        model: model,
        addLabel: pivotAddLabel,
      });
    } else {
      html += '<p class="o-pivot-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += _renderViewSwitcher(route, 'pivot');
      html += '<button type="button" id="btn-pivot-flip" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Flip axes</button>';
      html += '<button type="button" id="btn-pivot-download" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Download CSV</button>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      if (model === 'crm.lead') {
        html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + pivotAddLabel + '</button></p>';
    }
    html += '<div class="o-pivot-container o-card-gradient">';
    html += '<table class="o-pivot-table"><thead><tr><th class="o-pivot-th o-pivot-th--corner"></th>';
    colLabels.forEach(function (l) {
      html += '<th class="o-pivot-th o-pivot-th--measure">' + (l || '').replace(/</g, '&lt;') + '</th>';
    });
    html += '<th class="o-pivot-th o-pivot-th--total">Total</th></tr></thead><tbody>';
    rowVals.forEach(function (rv, ri) {
      html += '<tr><td class="o-pivot-td o-pivot-td--rowhead">' + (rowLabels[ri] || '').replace(/</g, '&lt;') + '</td>';
      colVals.forEach(function (cv) {
        var key = rv + '_' + cv;
        var val = matrix[key] || 0;
        html += '<td class="o-pivot-td o-pivot-td--num">' + (typeof val === 'number' ? val.toLocaleString() : val) + '</td>';
      });
      html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--rowtotal">' + (rowTotals[rv] || 0).toLocaleString() + '</td></tr>';
    });
    html += '<tr><td class="o-pivot-td o-pivot-td--coltotal">Total</td>';
    colVals.forEach(function (cv) {
      html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--coltotal">' + (colTotals[cv] || 0).toLocaleString() + '</td>';
    });
    html += '<td class="o-pivot-td o-pivot-td--num o-pivot-td--grandtotal">' + grandTotal.toLocaleString() + '</td></tr>';
    html += '</tbody></table></div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'viewChromeToolbarNew'); };
    var btnFlip = document.getElementById('btn-pivot-flip');
    if (btnFlip) {
      btnFlip.onclick = function () {
        renderPivot(model, route, pivotView, rows, colNames, rowNames, measures, colLabelMap, rowLabelMap, searchTerm, savedFiltersList);
      };
    }
    var btnDownload = document.getElementById('btn-pivot-download');
    if (btnDownload) {
      btnDownload.onclick = function () {
        var csv = ',' + colLabels.map(function (l) { return '"' + (l || '').replace(/"/g, '""') + '"'; }).join(',') + ',"Total"\n';
        rowVals.forEach(function (rv, ri) {
          csv += '"' + (rowLabels[ri] || '').replace(/"/g, '""') + '"';
          colVals.forEach(function (cv) {
            var key = rv + '_' + cv;
            csv += ',' + (matrix[key] || 0);
          });
          csv += ',' + (rowTotals[rv] || 0) + '\n';
        });
        csv += '"Total"';
        colVals.forEach(function (cv) { csv += ',' + (colTotals[cv] || 0); });
        csv += ',' + grandTotal + '\n';
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pivot_' + (route || 'data') + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var filterEl = document.getElementById('list-stage-filter');
        var val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        _loadRecords()(model, route, searchInput.value.trim(), val, 'pivot', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead') {
      var stageFilterEl = document.getElementById('list-stage-filter');
      if (stageFilterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              var opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              stageFilterEl.appendChild(opt);
            });
            stageFilterEl.onchange = function () {
              var val = stageFilterEl.value ? parseInt(stageFilterEl.value, 10) : null;
              _loadRecords()(model, route, searchInput ? searchInput.value.trim() : '', val, 'pivot', null, 0, null);
            };
          });
      }
    }
  }

  // ── Calendar ────────────────────────────────────────────────────────────

  function renderCalendar(model, route, records, searchTerm) {
    var main = _main();
    if (CalendarViewCore && typeof CalendarViewCore.render === 'function') {
      var coreHandled = CalendarViewCore.render(main, {
        model: model,
        route: route,
        records: records || [],
      });
      if (coreHandled) return;
    }
    var cmod = window.AppCore && window.AppCore.CalendarViewModule;
    if (cmod && typeof cmod.render === 'function') {
      var ok = cmod.render(main, {
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        viewsSvc: _viewsSvc(),
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        loadRecords: _loadRecords(),
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        setViewAndReload: _setViewAndReload,
        getListState: _getCurrentListState,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
        attachActWindowFormLinkDelegation: _attachActWindowFormLinkDelegation,
      });
      if (ok) return;
    }
    renderCalendarFallback(model, route, records, searchTerm);
  }

  function renderCalendarFallback(model, route, records, searchTerm) {
    var main = _main();
    var viewsSvc = _viewsSvc();
    var calendarView = viewsSvc && viewsSvc.getView(model, 'calendar');
    var dateField = (calendarView && calendarView.date_start) || 'date_deadline';
    var stringField = (calendarView && calendarView.string) || 'name';
    var title = _getTitle(route);
    _setActionStack([{ label: title, hash: route }]);
    var cls = _getCurrentListState();
    var calYear = (cls.route === route && cls.calendarYear) || new Date().getFullYear();
    var calMonth = (cls.route === route && cls.calendarMonth) || (new Date().getMonth() + 1);
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', viewType: 'calendar', calendarYear: calYear, calendarMonth: calMonth });
    var firstDay = new Date(calYear, calMonth - 1, 1);
    var lastDay = new Date(calYear, calMonth, 0);
    var startPad = firstDay.getDay();
    var daysInMonth = lastDay.getDate();
    var recordsByDate = {};
    (records || []).forEach(function (r) {
      var d = r[dateField];
      if (!d) return;
      var dateStr = typeof d === 'string' ? d.slice(0, 10) : (d && d.toISOString ? d.toISOString().slice(0, 10) : '');
      if (!dateStr) return;
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var calAddLabelCommon = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    var calAddLabel = (model === 'calendar.event') ? 'Add meeting' : calAddLabelCommon;
    var monthTitleStr = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
    var html = '<h2>' + title + '</h2>';
    if (window.AppCore && window.AppCore.CalendarViewChrome && typeof window.AppCore.CalendarViewChrome.buildToolbarHtml === 'function') {
      html += window.AppCore.CalendarViewChrome.buildToolbarHtml({
        viewSwitcherHtml: _renderViewSwitcher(route, 'calendar'),
        monthTitle: monthTitleStr,
        searchTerm: searchTerm || '',
        addLabel: calAddLabel,
      });
    } else {
      html += '<p class="o-calendar-toolbar-fallback" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
      html += _renderViewSwitcher(route, 'calendar');
      html += '<button type="button" id="cal-prev" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Prev</button>';
      html += '<span id="cal-title" style="min-width:140px;font-weight:600">' + monthTitleStr + '</span>';
      html += '<button type="button" id="cal-next" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Next</button>';
      html += '<button type="button" id="cal-today" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Today</button>';
      html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
      html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + calAddLabel + '</button></p>';
    }
    html += '<div class="o-calendar o-calendar-grid">';
    dayNames.forEach(function (dn) {
      html += '<div class="o-calendar-weekday">' + dn + '</div>';
    });
    var totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (var i = 0; i < totalCells; i++) {
      var dayNum = i - startPad + 1;
      var isEmpty = dayNum < 1 || dayNum > daysInMonth;
      var dateStr = isEmpty ? '' : calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
      var dayRecs = dateStr ? (recordsByDate[dateStr] || []) : [];
      var cellContent = isEmpty ? '' : '<span class="o-calendar-daynum">' + dayNum + '</span>';
      dayRecs.forEach(function (rec) {
        var label = (rec[stringField] || 'Untitled').replace(/</g, '&lt;').slice(0, 30);
        cellContent += '<div class="o-calendar-event-wrap"><a href="#' + route + '/edit/' + (rec.id || '') + '" class="o-calendar-event-link o-erp-actwindow-form-link" data-edit-id="' + (rec.id || '') + '">' + label + '</a></div>';
      });
      html += '<div class="o-calendar-cell' + (isEmpty ? ' o-calendar-cell--empty' : '') + '">' + cellContent + '</div>';
    }
    html += '</div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    var btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'viewChromeToolbarNew'); };
    var doReload = function () {
      var si = document.getElementById('list-search');
      _loadRecords()(model, route, si ? si.value.trim() : '', null, 'calendar', null, 0, null);
    };
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    var todayBtn = document.getElementById('cal-today');
    if (prevBtn) prevBtn.onclick = function () {
      calMonth--;
      if (calMonth < 1) { calMonth = 12; calYear--; }
      var s = _getCurrentListState();
      s.calendarYear = calYear;
      s.calendarMonth = calMonth;
      _setCurrentListState(s);
      doReload();
    };
    if (nextBtn) nextBtn.onclick = function () {
      calMonth++;
      if (calMonth > 12) { calMonth = 1; calYear++; }
      var s = _getCurrentListState();
      s.calendarYear = calYear;
      s.calendarMonth = calMonth;
      _setCurrentListState(s);
      doReload();
    };
    if (todayBtn) todayBtn.onclick = function () {
      var now = new Date();
      var s = _getCurrentListState();
      s.calendarYear = now.getFullYear();
      s.calendarMonth = now.getMonth() + 1;
      _setCurrentListState(s);
      doReload();
    };
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () { _loadRecords()(model, route, searchInput.value.trim(), null, 'calendar', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    _attachActWindowFormLinkDelegation('.o-calendar-grid', route, 'calendarEventEditLink');
  }

  // ── Kanban ──────────────────────────────────────────────────────────────

  function renderKanban(model, route, records, searchTerm) {
    var main = _main();
    var mod = window.AppCore && window.AppCore.KanbanViewModule;
    if (mod && typeof mod.render === 'function') {
      var ok = mod.render(main, {
        model: model,
        route: route,
        records: records,
        searchTerm: searchTerm,
        viewsSvc: _viewsSvc(),
        rpc: _rpc(),
        showToast: _showToast,
        getTitle: _getTitle,
        renderViewSwitcher: _renderViewSwitcher,
        dispatchListActWindowThenFormHash: _dispatchListActWindowThenFormHash,
        loadRecords: _loadRecords(),
        setViewAndReload: _setViewAndReload,
        getListState: _getCurrentListState,
        setListState: function (s) { _setCurrentListState(s); },
        setActionStack: function (stack) { _setActionStack(stack); },
      });
      if (ok) return;
    }
    renderKanbanFallback(model, route, records, searchTerm);
  }

  function renderKanbanFallback(model, route, records, searchTerm) {
    var main = _main();
    var rpc = _rpc();
    var viewsSvc = _viewsSvc();
    var title = _getTitle(route);
    _setActionStack([{ label: title, hash: route }]);
    var addLabel = route === 'leads' ? 'Add lead' : route === 'tickets' ? 'Add ticket' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    var cls = _getCurrentListState();
    var stageFilter = cls.route === route ? cls.stageFilter : null;
    var currentView = (cls.route === route && cls.viewType) || 'kanban';
    var kanbanView = viewsSvc && viewsSvc.getView(model, 'kanban');
    var vs = _renderViewSwitcher(route, currentView);
    var mid =
      model === 'crm.lead' || model === 'helpdesk.ticket'
        ? '<select id="list-stage-filter" class="o-list-toolbar-select"><option value="">All stages</option></select>'
        : '';
    var KS = window.AppCore && window.AppCore.KanbanControlStrip;
    var html =
      KS && typeof KS.buildKanbanChromeHtml === 'function'
        ? KS.buildKanbanChromeHtml({
            title: title,
            viewSwitcherHtml: vs,
            searchTerm: searchTerm || '',
            addLabel: addLabel,
            middleSlotHtml: mid,
          })
        : '<h2>' +
          title +
          '</h2><p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">' +
          vs +
          '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' +
          (searchTerm || '').replace(/"/g, '&quot;') +
          '"><button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>' +
          mid +
          '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
          addLabel +
          '</button></p><div id="kanban-area"></div>';
    main.innerHTML = html;
    _setCurrentListState({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: currentView });
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { var v = btn.dataset.view; if (v) _setViewAndReload(route, v); };
    });
    var btn = document.getElementById('btn-add');
    if (btn) btn.onclick = function () { _dispatchListActWindowThenFormHash(route, 'new', 'kanbanToolbarNew'); };
    var btnSearch = document.getElementById('btn-search');
    var searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      var doSearch = function () {
        var filterEl = document.getElementById('list-stage-filter');
        var val = filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        _loadRecords()(model, route, searchInput.value.trim(), val);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead' || model === 'helpdesk.ticket') {
      var filterEl = document.getElementById('list-stage-filter');
      var stageModel = model === 'helpdesk.ticket' ? 'helpdesk.stage' : 'crm.stage';
      if (filterEl) {
        rpc.callKw(stageModel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              var opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              var val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              _loadRecords()(model, route, searchInput.value.trim(), val);
            };
          });
      }
    }
    var groupBy = (kanbanView && kanbanView.default_group_by) || 'stage_id';
    var stageIds = [];
    (records || []).forEach(function (r) {
      var val = r[groupBy];
      var id = (val && (Array.isArray(val) ? val[0] : val)) || (val === 0 ? 0 : null);
      if (id != null) stageIds.push(id);
    });
    var uniq = stageIds.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var comodelMap = { 'crm.lead': 'crm.stage', 'project.task': 'project.task.type', 'helpdesk.ticket': 'helpdesk.stage' };
    var comodel = comodelMap[model] || (groupBy === 'stage_id' ? 'crm.stage' : null);
    var nameMap = {};
    function renderKanbanWithOptions(opts) {
      window.ViewRenderers.kanban(document.getElementById('kanban-area'), model, records, opts);
    }
    var baseOpts = {
      default_group_by: groupBy,
      fields: (kanbanView && kanbanView.fields) || ['name', 'expected_revenue', 'date_deadline'],
      stageNames: nameMap,
      onCardClick: function (id) { _dispatchListActWindowThenFormHash(route, 'edit/' + id, 'kanbanCardOpenForm'); },
      onStageChange: function (recordId, newStageId) {
        var stageVal = newStageId || false;
        var writeVal = {};
        writeVal[groupBy] = stageVal;
        rpc.callKw(model, 'write', [[parseInt(recordId, 10)], writeVal])
          .then(function () { return _loadRecords()(model, route, _getCurrentListState().searchTerm); })
          .catch(function (err) { _showToast(err.message || 'Failed to update', 'error'); });
      },
      onQuickCreate: function (stageId, name, done) {
        var vals = { name: name };
        vals[groupBy] = stageId || false;
        rpc.callKw(model, 'create', [[vals]], {})
          .then(function () {
            _showToast('Created', 'success');
            if (typeof done === 'function') done();
            return _loadRecords()(model, route, _getCurrentListState().searchTerm);
          })
          .catch(function (err) { _showToast(err.message || 'Failed to create', 'error'); });
      }
    };
    if (comodel && uniq.length) {
      rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
        .then(function (stages) {
          stages.forEach(function (s) { nameMap[s.id] = s.name; });
          baseOpts.stageNames = nameMap;
          renderKanbanWithOptions(baseOpts);
        })
        .catch(function () { renderKanbanWithOptions(baseOpts); });
    } else if (uniq.length || groupBy) {
      uniq.forEach(function (id) { if (id && !nameMap[id]) nameMap[id] = 'Stage ' + id; });
      baseOpts.stageNames = nameMap;
      renderKanbanWithOptions(baseOpts);
    } else {
      renderKanbanWithOptions({
        default_group_by: groupBy,
        stageNames: {},
        onCardClick: baseOpts.onCardClick,
        onQuickCreate: baseOpts.onQuickCreate,
      });
    }
  }

  // ── Install + Public API ────────────────────────────────────────────────

  CV.install = function (ctx) {
    if (_installed) return CV;
    _installed = true;
    _ctx = ctx || {};
    GraphViewCore = window.AppCore && window.AppCore.GraphView ? window.AppCore.GraphView : null;
    PivotViewCore = window.AppCore && window.AppCore.PivotView ? window.AppCore.PivotView : null;
    CalendarViewCore = window.AppCore && window.AppCore.CalendarView ? window.AppCore.CalendarView : null;
    GanttViewCore = window.AppCore && window.AppCore.GanttView ? window.AppCore.GanttView : null;
    ActivityViewCore = window.AppCore && window.AppCore.ActivityView ? window.AppCore.ActivityView : null;
    return CV;
  };

  CV.loadActivityData = loadActivityData;
  CV.loadGanttData = loadGanttData;
  CV.renderGanttView = renderGanttView;
  CV.renderGanttViewFallback = renderGanttViewFallback;
  CV.renderActivityMatrix = renderActivityMatrix;
  CV.renderActivityMatrixFallback = renderActivityMatrixFallback;
  CV.loadGraphData = loadGraphData;
  CV.renderGraph = renderGraph;
  CV.renderGraphFallback = renderGraphFallback;
  CV.loadPivotData = loadPivotData;
  CV.renderPivot = renderPivot;
  CV.renderPivotFallback = renderPivotFallback;
  CV.renderCalendar = renderCalendar;
  CV.renderCalendarFallback = renderCalendarFallback;
  CV.renderKanban = renderKanban;
  CV.renderKanbanFallback = renderKanbanFallback;
})();
