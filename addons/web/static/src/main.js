/**
 * ERP Platform Web Client - Data-driven menus, actions, list/form views
 */
(function () {
  const main = document.getElementById('action-manager');
  const navbar = document.getElementById('navbar');
  if (!main) return;

  const rpc = window.Services && window.Services.rpc ? window.Services.rpc : (window.Session || { callKw: () => Promise.reject(new Error('RPC not loaded')) });
  const viewsSvc = window.Services && window.Services.views ? window.Services.views : null;

  /** Map act_window res_model to hash route (convention: res.partner -> contacts) */
  function actionToRoute(action) {
    if (!action || action.type !== 'ir.actions.act_window') return null;
    const m = (action.res_model || '').replace(/\./g, '_');
    if (m === 'res_partner') return 'contacts';
    if (m === 'crm_lead') return 'leads';
    return m || null;
  }

  /** Map menu to hash route when no action (e.g. Settings, API Keys) */
  function menuToRoute(m) {
    if (!m) return null;
    const name = (m.name || '').toLowerCase();
    if (name === 'home') return 'home';
    if (name === 'settings') return 'settings';
    if (name === 'api keys') return 'settings/apikeys';
    return null;
  }

  /** Get action for route (from menu) */
  function getActionForRoute(route) {
    if (!viewsSvc) return null;
    const menus = viewsSvc.getMenus() || [];
    for (let i = 0; i < menus.length; i++) {
      const action = menus[i].action ? viewsSvc.getAction(menus[i].action) : null;
      if (action && actionToRoute(action) === route) return action;
    }
    return null;
  }

  /** Get model name for route slug (inverse of actionToRoute) */
  function getModelForRoute(route) {
    const action = getActionForRoute(route);
    if (action) return action.res_model || action.resModel;
    if (route === 'contacts') return 'res.partner';
    if (route === 'leads') return 'crm.lead';
    return null;
  }

  /** Parse action domain string to array (JSON or Python-like) */
  function parseActionDomain(s) {
    if (!s || typeof s !== 'string') return [];
    const t = s.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
    return [];
  }

  function buildMenuTree(menus) {
    const byId = {};
    const roots = [];
    (menus || []).forEach(function (m) {
      byId[m.id || m.name] = { menu: m, children: [] };
    });
    (menus || []).forEach(function (m) {
      const node = byId[m.id || m.name];
      if (!node) return;
      const parentRef = m.parent || '';
      if (!parentRef || !byId[parentRef]) {
        roots.push(node);
      } else {
        byId[parentRef].children.push(node);
      }
    });
    roots.sort(function (a, b) { return (a.menu.sequence || 0) - (b.menu.sequence || 0); });
    roots.forEach(function (n) {
      n.children.sort(function (a, b) { return (a.menu.sequence || 0) - (b.menu.sequence || 0); });
    });
    return roots;
  }

  function renderNavbar() {
    if (!navbar) return;
    let html = '<span class="logo">ERP Platform</span><nav class="nav-menu" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">';
    if (viewsSvc) {
      const menus = viewsSvc.getMenus() || [];
      const tree = buildMenuTree(menus);
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
    html += '</nav><span class="nav-user" style="margin-left:auto">';
    html += '<a href="/web/logout" class="nav-link">Logout</a>';
    html += '</span>';
    navbar.innerHTML = html;
    navbar.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      const label = dd.querySelector('a');
      const content = dd.querySelector('.nav-dropdown-content');
      if (label && content) {
        label.onmouseenter = function () { content.style.display = 'block'; };
        dd.onmouseleave = function () { content.style.display = 'none'; };
      }
    });
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    return model === 'crm.lead' ? ['name', 'type', 'stage_id', 'expected_revenue', 'tag_ids'] : ['name', 'is_company', 'email', 'phone', 'city', 'country_id', 'state_id'];
  }

  function getSearchFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'search');
      if (v && v.search_fields && v.search_fields.length) return v.search_fields;
    }
    return ['name'];
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

  var _savedFilterId = 0;
  function getSavedFilters(model) {
    try {
      const raw = localStorage.getItem('erp_saved_filters_' + (model || '').replace(/\./g, '_'));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveSavedFilter(model, name, domain) {
    const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
    const filters = getSavedFilters(model);
    const id = 'f' + (++_savedFilterId) + Date.now();
    filters.push({ id: id, name: name || 'Filter', domain: domain || [] });
    try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
    return id;
  }
  function removeSavedFilter(model, id) {
    const key = 'erp_saved_filters_' + (model || '').replace(/\./g, '_');
    const filters = getSavedFilters(model).filter(function (f) { return f.id !== id; });
    try { localStorage.setItem(key, JSON.stringify(filters)); } catch (e) {}
  }

  function getFormFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'form');
      if (v && v.fields && v.fields.length) return v.fields.map(f => (typeof f === 'object' ? f.name : f) || f);
    }
    return model === 'crm.lead' ? ['name', 'type', 'partner_id', 'stage_id', 'expected_revenue', 'description', 'note_html', 'tag_ids', 'activity_ids'] : ['name', 'is_company', 'type', 'email', 'phone', 'street', 'street2', 'city', 'zip', 'country_id', 'state_id'];
  }

  function getTitle(route) {
    if (route === 'contacts') return 'Contacts';
    if (route === 'leads') return 'Leads';
    return route || 'Records';
  }

  String.prototype.escapeHtml = function () {
    const div = document.createElement('div');
    div.textContent = this;
    return div.innerHTML;
  };

  function renderHome() {
    main.innerHTML = '<h2>Welcome</h2><p>Use the menu to navigate. <strong>Contacts</strong> and <strong>Leads</strong> are available.</p>';
  }

  function renderSettingsStub() {
    main.innerHTML = '<h2>Settings</h2><p style="margin-bottom:1rem">Manage your account and preferences.</p>';
    main.innerHTML += '<div style="display:flex;flex-direction:column;gap:0.5rem">';
    main.innerHTML += '<a href="#settings/apikeys" style="display:block;padding:0.75rem 1rem;border:1px solid var(--border-color,#ddd);border-radius:4px;text-decoration:none;color:inherit;max-width:280px">API Keys</a>';
    main.innerHTML += '<p style="margin-top:0.5rem;color:var(--text-muted,#666);font-size:0.9rem">More settings coming soon.</p>';
    main.innerHTML += '</div>';
  }

  function renderApiKeysSettings() {
    main.innerHTML = '<h2>API Keys</h2><p>Loading...</p>';
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      main.innerHTML = '<h2>API Keys</h2><p class="error">Session not available.</p>';
      return;
    }
    sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        main.innerHTML = '<h2>API Keys</h2><p class="error">Not logged in.</p>';
        return;
      }
      rpc.callKw('res.users.apikeys', 'search_read', [[['user_id', '=', info.uid]]], { fields: ['id', 'name'] })
        .then(function (keys) {
          let html = '<h2>API Keys</h2>';
          html += '<p style="margin-bottom:1rem">Use API keys to authenticate with the JSON-2 API. Use <code>Authorization: Bearer &lt;key&gt;</code>.</p>';
          html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">';
          html += '<input type="text" id="apikey-name" placeholder="Key name (e.g. My App)" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:180px">';
          html += '<button type="button" id="btn-generate" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Generate</button>';
          html += '</p>';
          if (!keys || !keys.length) {
            html += '<p>No API keys yet. Generate one above.</p>';
          } else {
            html += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
            html += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">Name</th>';
            html += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">Actions</th></tr></thead><tbody>';
            keys.forEach(function (k) {
              html += '<tr data-id="' + (k.id || '') + '"><td style="padding:0.5rem;border-bottom:1px solid #eee">' + (k.name || 'API Key').replace(/</g, '&lt;') + '</td>';
              html += '<td style="padding:0.5rem;border-bottom:1px solid #eee"><a href="#" class="btn-revoke" data-id="' + (k.id || '') + '" style="font-size:0.9rem;color:#c00">Revoke</a></td></tr>';
            });
            html += '</tbody></table>';
          }
          main.innerHTML = html;
          const btn = document.getElementById('btn-generate');
          const nameInput = document.getElementById('apikey-name');
          if (btn && nameInput) {
            btn.onclick = function () {
              const name = (nameInput.value || 'API Key').trim();
              btn.disabled = true;
              rpc.callKw('res.users.apikeys', 'generate', [info.uid, name])
                .then(function (rawKey) {
                  btn.disabled = false;
                  const msg = 'Copy your API key now. It will not be shown again:\n\n' + rawKey;
                  if (typeof navigator.clipboard !== 'undefined' && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(rawKey).then(function () {
                      alert('API key generated and copied to clipboard.');
                    }).catch(function () { alert(msg); });
                  } else {
                    alert(msg);
                  }
                  renderApiKeysSettings();
                })
                .catch(function (err) {
                  btn.disabled = false;
                  alert(err.message || 'Failed to generate key');
                });
            };
          }
          main.querySelectorAll('.btn-revoke').forEach(function (el) {
            el.onclick = function (e) {
              e.preventDefault();
              var id = parseInt(el.getAttribute('data-id'), 10);
              if (!confirm('Revoke this API key? It will stop working immediately.')) return;
              rpc.callKw('res.users.apikeys', 'revoke', [[id]])
                .then(function () { renderApiKeysSettings(); })
                .catch(function (err) { alert(err.message || 'Failed to revoke'); });
            };
          });
        })
        .catch(function (err) {
          main.innerHTML = '<h2>API Keys</h2><p class="error">' + (err.message || 'Failed to load keys') + '</p>';
        });
    });
  }

  function getDisplayNames(model, colName, records) {
    const comodel = getMany2oneComodel(model, colName);
    if (!comodel) return Promise.resolve({});
    const ids = [];
    records.forEach(function (r) { const v = r[colName]; if (v) ids.push(v); });
    if (!ids.length) return Promise.resolve({});
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    const map = {};
    return rpc.callKw(comodel, 'read', [uniq, ['id', 'name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  function getDisplayNamesForMany2many(model, colName, records) {
    const m2m = getMany2manyInfo(model, colName);
    if (!m2m || !m2m.comodel) return Promise.resolve({});
    const ids = [];
    records.forEach(function (r) {
      const v = r[colName];
      if (Array.isArray(v)) v.forEach(function (id) { ids.push(id); });
    });
    if (!ids.length) return Promise.resolve({});
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    const map = {};
    return rpc.callKw(m2m.comodel, 'read', [uniq, ['id', 'name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  function renderViewSwitcher(route, currentView) {
    const modes = getAvailableViewModes(route).filter(function (m) { return m === 'list' || m === 'kanban'; });
    if (modes.length < 2) return '';
    let html = '<span class="view-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
    modes.forEach(function (m) {
      const active = m === currentView;
      html += '<button type="button" class="btn-view' + (active ? ' active' : '') + '" data-view="' + m + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (m === 'list' ? 'List' : 'Kanban') + '</button>';
    });
    return html + '</span>';
  }

  function renderList(model, route, records, searchTerm) {
    const cols = getListColumns(model);
    const title = getTitle(route);
    const addLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = (currentListState.route === route && currentListState.viewType) || 'list';
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += renderViewSwitcher(route, currentView);
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    const savedFiltersList = getSavedFilters(model);
    html += '<select id="list-saved-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">Filters</option>';
    savedFiltersList.forEach(function (f) {
      html += '<option value="' + (f.id || '').replace(/"/g, '&quot;') + '"' + (currentListState.savedFilterId === f.id ? ' selected' : '') + '>' + (f.name || 'Filter').replace(/</g, '&lt;') + '</option>';
    });
    html += '</select>';
    html += '<button type="button" id="btn-save-filter" style="padding:0.5rem 0.75rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Save</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p>';
    if (!records || !records.length) {
      main.innerHTML = html + '<p>No records yet.</p>';
    } else {
      const m2oCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return getMany2oneComodel(model, f);
      });
      const m2mCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return getMany2manyInfo(model, f);
      });
      function renderTable(nameMap) {
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(c => { tbl += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">' + (typeof c === 'object' ? c.name || c : c) + '</th>'; });
        tbl += '<th></th></tr></thead><tbody>';
        records.forEach(r => {
          tbl += '<tr data-id="' + (r.id || '') + '">';
          cols.forEach(c => {
            const f = typeof c === 'object' ? c.name : c;
            let val = r[f];
            if (nameMap && nameMap[f] && val != null) {
              if (Array.isArray(val)) {
                val = val.map(function (id) { return nameMap[f][id] || id; }).join(', ');
              } else {
                val = nameMap[f][val] || val;
              }
            } else if (val != null) {
              if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
              else {
                const selLabel = getSelectionLabel(model, f, val);
                if (selLabel !== val) val = selLabel;
              }
            }
            tbl += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (val != null ? String(val) : '').replace(/</g, '&lt;') + '</td>';
          });
          tbl += '<td style="padding:0.5rem"><a href="#' + route + '/edit/' + (r.id || '') + '" style="font-size:0.9rem;margin-right:0.5rem">Edit</a>';
          tbl += '<a href="#" class="btn-delete" data-id="' + (r.id || '') + '" style="font-size:0.9rem;color:#c00">Delete</a></td></tr>';
        });
        tbl += '</tbody></table>';
        main.innerHTML = html + tbl;
      }
      const allCols = m2oCols.length || m2mCols.length;
      if (allCols) {
        const promises = m2oCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }).concat(m2mCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNamesForMany2many(model, f, records).then(function (m) { return { f: f, m: m }; });
        }));
        Promise.all(promises).then(function (maps) {
          const nameMap = {};
          maps.forEach(function (x) { nameMap[x.f] = x.m; });
          renderTable(nameMap);
        }).catch(function () { renderTable({}); });
      } else {
        renderTable(null);
      }
    }
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = () => { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const sf = document.getElementById('list-saved-filter');
        const stageEl = document.getElementById('list-stage-filter');
        const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), stageVal, null, sf && sf.value ? sf.value : null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); if (confirm('Delete this record?')) deleteRecord(model, route, a.dataset.id); };
    });
    main.querySelectorAll('.btn-view').forEach(btn => {
      btn.onclick = () => { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    if (model === 'crm.lead') {
      const filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, document.getElementById('list-search').value.trim(), val, null, null);
            };
          });
      }
    }
    const savedFilterEl = document.getElementById('list-saved-filter');
    if (savedFilterEl) {
      savedFilterEl.onchange = function () {
        const fid = savedFilterEl.value || null;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, fid);
      };
    }
    const btnSaveFilter = document.getElementById('btn-save-filter');
    if (btnSaveFilter) {
      btnSaveFilter.onclick = function () {
        const name = prompt('Filter name:');
        if (!name || !name.trim()) return;
        const si = document.getElementById('list-search');
        const st = si ? si.value.trim() : '';
        const action = getActionForRoute(route);
        const actionDomain = action ? parseActionDomain(action.domain || '') : [];
        let domain = actionDomain.slice();
        const searchDom = buildSearchDomain(model, st);
        if (searchDom.length) domain = domain.concat(searchDom);
        if (model === 'crm.lead' && stageFilter) domain = domain.concat([['stage_id', '=', stageFilter]]);
        saveSavedFilter(model, name.trim(), domain);
        loadRecords(model, route, st, stageFilter, null, null);
      };
    }
  }

  let currentListState = { model: null, route: null, searchTerm: '', stageFilter: null, viewType: null, savedFilterId: null };

  function deleteRecord(model, route, id) {
    rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(() => loadRecords(model, route, currentListState.searchTerm))
      .catch(err => { alert(err.message || 'Failed to delete'); });
  }

  function getViewFieldDef(model, fname) {
    if (!viewsSvc || !model || !fname) return null;
    const formV = viewsSvc.getView(model, 'form');
    if (formV && formV.fields) {
      const f = formV.fields.find(function (x) { const n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (f && typeof f === 'object') return f;
    }
    const listV = viewsSvc.getView(model, 'list');
    if (listV && listV.columns) {
      const c = listV.columns.find(function (x) { const n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (c && typeof c === 'object') return c;
    }
    return null;
  }

  function getMany2oneComodel(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) return def.comodel;
    if (model === 'crm.lead' && fname === 'partner_id') return 'res.partner';
    if (model === 'crm.lead' && fname === 'stage_id') return 'crm.stage';
    if (model === 'res.partner' && fname === 'country_id') return 'res.country';
    if (model === 'res.partner' && fname === 'state_id') return 'res.country.state';
    return null;
  }

  function getMany2oneDomain(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.domain_dep) {
      const dep = def.domain_dep;
      return { depField: dep, domain: [[dep, '=', null]] };
    }
    if (model === 'res.partner' && fname === 'state_id') return { depField: 'country_id', domain: [['country_id', '=', null]] };
    return null;
  }

  function getSelectionOptions(model, fname) {
    if (model === 'crm.lead' && fname === 'type') return [['lead', 'Lead'], ['opportunity', 'Opportunity']];
    if (model === 'res.partner' && fname === 'type') return [['contact', 'Contact'], ['address', 'Address']];
    return null;
  }

  function isBooleanField(model, fname) {
    return model === 'res.partner' && fname === 'is_company';
  }

  function getSelectionLabel(model, fname, value) {
    const opts = getSelectionOptions(model, fname);
    if (!opts || value == null || value === '') return value;
    const pair = opts.find(function (o) { return o[0] === value || String(o[0]) === String(value); });
    return pair ? pair[1] : value;
  }

  function getOne2manyInfo(model, fname) {
    if (model === 'crm.lead' && fname === 'activity_ids') return { comodel: 'crm.activity', inverse: 'lead_id' };
    return null;
  }

  function getMany2manyInfo(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) return { comodel: def.comodel };
    if (model === 'crm.lead' && fname === 'tag_ids') return { comodel: 'crm.tag' };
    return null;
  }

  function renderForm(model, route, id) {
    const fields = getFormFields(model);
    const title = getTitle(route);
    const isNew = !id;
    const formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    let html = '<h2>' + formTitle + '</h2><form id="record-form" style="max-width:400px">';
    fields.forEach(f => {
      const fname = typeof f === 'object' ? f.name : f;
      const o2m = getOne2manyInfo(model, fname);
      const m2m = getMany2manyInfo(model, fname);
      if (o2m) {
        html += '<p><label>' + fname + '</label><div id="o2m-' + fname + '" data-comodel="' + (o2m.comodel || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em"></div></p>';
        return;
      }
      if (m2m) {
        html += '<p><label>' + fname + '</label><div id="m2m-' + fname + '" data-comodel="' + (m2m.comodel || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em"></div></p>';
        return;
      }
      const required = fname === 'name';
      const comodel = getMany2oneComodel(model, fname);
      const selectionOpts = getSelectionOptions(model, fname);
      const isBool = isBooleanField(model, fname);
      const inputType = isBool ? 'boolean' : (fname === 'email' ? 'email' : (fname === 'description' || fname === 'note_html') ? 'textarea' : selectionOpts ? 'selection' : (comodel ? 'many2one' : 'text'));
      if (inputType === 'boolean') {
        html += '<p><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="' + fname + '"> ' + fname + '</label></p>';
      } else if (inputType === 'textarea') {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
      } else if (inputType === 'selection') {
        let opts = '<option value="">--</option>';
        selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem">' + opts + '</select></label></p>';
      } else if (inputType === 'many2one') {
        const domainInfo = getMany2oneDomain(model, fname);
        const depAttr = domainInfo ? ' data-depends-on="' + domainInfo.depField + '"' : '';
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem" data-comodel="' + (comodel || '') + '"' + depAttr + '><option value="">--</option></select></label></p>';
      } else {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
      }
    });
    html += '<p><button type="submit" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Save</button> ';
    html += '<a href="#' + route + '" style="margin-left:0.5rem">Cancel</a></p></form>';
    main.innerHTML = html;
    const form = document.getElementById('record-form');
    const selects = form.querySelectorAll('select[data-comodel]');
    const m2mDivs = form.querySelectorAll('[id^="m2m-"]');
    const getFormFieldVal = function (name) {
      const el = form.querySelector('[name="' + name + '"]');
      return el ? (el.value ? parseInt(el.value, 10) || el.value : null) : null;
    };
    const loadSelectOptions = function (sel, domain) {
      const comodel = sel.dataset.comodel;
      if (!comodel) return Promise.resolve();
      const d = domain || [];
      return rpc.callKw(comodel, 'search_read', [d], { fields: ['id', 'name'], limit: 200 })
        .then(function (opts) {
          sel.innerHTML = '<option value="">--</option>';
          opts.forEach(function (o) {
            sel.appendChild(document.createElement('option')).value = o.id;
            sel.lastChild.textContent = o.name || o.id;
          });
        });
    };
    const loadOptions = function (formVals) {
      const promises = [];
      selects.forEach(function (sel) {
        const comodel = sel.dataset.comodel;
        const fname = sel.getAttribute('name');
        if (!comodel) return;
        const domainInfo = getMany2oneDomain(model, fname);
        let domain = [];
        if (domainInfo) {
          const depVal = formVals ? formVals[domainInfo.depField] : getFormFieldVal(domainInfo.depField);
          if (depVal) domain = [[domainInfo.depField, '=', depVal]];
          else domain = [[domainInfo.depField, '=', 0]];
        }
        promises.push(loadSelectOptions(sel, domain));
      });
      m2mDivs.forEach(function (div) {
        const comodel = div.dataset.comodel;
        const fname = (div.id || '').replace('m2m-', '');
        if (!comodel) return;
        promises.push(
          rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], limit: 200 })
            .then(function (opts) {
              let inner = '';
              opts.forEach(function (o) {
                inner += '<label style="display:inline-block;margin-right:1rem;margin-bottom:0.25rem"><input type="checkbox" name="' + fname + '_cb" value="' + o.id + '"> ' + (o.name || o.id).replace(/</g, '&lt;') + '</label>';
              });
              div.innerHTML = inner || 'No options';
            })
        );
      });
      return Promise.all(promises);
    };
    const setupDependsOnHandlers = function () {
      selects.forEach(function (sel) {
        const fname = sel.getAttribute('name');
        const domainInfo = getMany2oneDomain(model, fname);
        if (!domainInfo) return;
        const depEl = form.querySelector('[name="' + domainInfo.depField + '"]');
        if (depEl) {
          depEl.onchange = function () {
            const depVal = getFormFieldVal(domainInfo.depField);
            loadSelectOptions(sel, depVal ? [[domainInfo.depField, '=', depVal]] : [[domainInfo.depField, '=', 0]])
              .then(function () {
                const stateEl = form.querySelector('[name="' + fname + '"]');
                if (stateEl) stateEl.value = '';
              });
          };
        }
      });
    };
    const setM2mChecked = function (fname, ids) {
      const idSet = (ids || []).map(function (x) { return String(x); });
      form.querySelectorAll('input[name="' + fname + '_cb"]').forEach(function (cb) {
        cb.checked = idSet.indexOf(String(cb.value)) >= 0;
      });
    };
    if (isNew) {
      loadOptions({}).then(setupDependsOnHandlers);
      form.onsubmit = (e) => { e.preventDefault(); createRecord(model, route, form); return false; };
    } else {
      loadRecord(model, id).then(function (r) {
        if (r && r[0]) {
          const rec = r[0];
          return loadOptions({ country_id: rec.country_id, state_id: rec.state_id }).then(function () {
            setupDependsOnHandlers();
            const set = (n, v) => { const el = form.querySelector('[name="' + n + '"]'); if (el) el.value = v != null ? v : ''; };
            fields.forEach(f => {
            const n = typeof f === 'object' ? f.name : f;
            const o2m = getOne2manyInfo(model, n);
            const m2m = getMany2manyInfo(model, n);
            if (m2m) {
              setM2mChecked(n, rec[n]);
            } else if (o2m) {
              const div = form.querySelector('#o2m-' + n);
              if (div && rec[n] && Array.isArray(rec[n]) && rec[n].length) {
                rpc.callKw(o2m.comodel, 'search_read', [[['id', 'in', rec[n]]]], { fields: ['id', 'name', 'note', 'date_deadline'] })
                  .then(function (rows) {
                    if (rows.length) {
                      let tbl = '<table style="width:100%;font-size:0.9rem"><thead><tr><th style="text-align:left">Name</th><th style="text-align:left">Note</th><th>Due</th></tr></thead><tbody>';
                      rows.forEach(function (row) {
                        tbl += '<tr><td>' + (row.name || '').replace(/</g, '&lt;') + '</td><td>' + (row.note || '').replace(/</g, '&lt;').substring(0, 50) + '</td><td>' + (row.date_deadline || '') + '</td></tr>';
                      });
                      div.innerHTML = tbl + '</tbody></table>';
                    } else {
                      div.textContent = 'No items';
                    }
                  })
                  .catch(function () { div.textContent = '—'; });
              } else if (div) {
                div.textContent = 'No items';
              }
            } else if (isBooleanField(model, n)) {
              const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
              if (cb) cb.checked = !!rec[n];
            } else {
              set(n, rec[n]);
            }
          });
          });
        }
      }).catch(function () {});
      form.onsubmit = (e) => { e.preventDefault(); updateRecord(model, route, id, form); return false; };
    }
  }

  function getFormVals(form, model) {
    const fields = getFormFields(model);
    const byName = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    const vals = {};
    fields.forEach(f => {
      const n = typeof f === 'object' ? f.name : f;
      if (getOne2manyInfo(model, n)) return;
      const m2m = getMany2manyInfo(model, n);
      if (m2m) {
        const ids = [];
        form.querySelectorAll('input[name="' + n + '_cb"]:checked').forEach(function (cb) { ids.push(parseInt(cb.value, 10)); });
        vals[n] = ids;
        return;
      }
      if (isBooleanField(model, n)) {
        const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
        vals[n] = cb ? !!cb.checked : false;
        return;
      }
      let v = byName(n).trim();
      const comodel = getMany2oneComodel(model, n);
      const selectionOpts = getSelectionOptions(model, n);
      if (comodel) {
        vals[n] = v ? parseInt(v, 10) : null;
      } else if (selectionOpts) {
        vals[n] = v || (selectionOpts[0] ? selectionOpts[0][0] : null);
      } else {
        vals[n] = v;
      }
    });
    return vals;
  }

  function showFormError(form, msg) {
    const prev = form.querySelector('.error');
    if (prev) prev.remove();
    form.insertAdjacentHTML('beforeend', '<p class="error" style="color:#c00;margin-top:0.5rem">' + msg.replace(/</g, '&lt;') + '</p>');
  }

  function createRecord(model, route, form) {
    const vals = getFormVals(form, model);
    const requiredField = model === 'crm.lead' || model === 'res.partner' ? 'name' : 'name';
    if (!vals[requiredField]) {
      showFormError(form, 'Please enter ' + requiredField + '.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'create', [[vals]])
      .then(() => { window.location.hash = route; loadRecords(model, route, currentListState.searchTerm); })
      .catch(err => {
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        if ((err.message || '').indexOf('Session expired') >= 0) { window.location.href = '/web/login'; return; }
        showFormError(form, err.message || 'Failed to save');
      });
  }

  function updateRecord(model, route, id, form) {
    const vals = getFormVals(form, model);
    const requiredField = 'name';
    if (!vals[requiredField]) {
      showFormError(form, 'Please enter ' + requiredField + '.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'write', [[parseInt(id, 10)], vals])
      .then(() => { window.location.hash = route; loadRecords(model, route, currentListState.searchTerm); })
      .catch(err => {
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        if ((err.message || '').indexOf('Session expired') >= 0) { window.location.href = '/web/login'; return; }
        showFormError(form, err.message || 'Failed to save');
      });
  }

  function loadRecord(model, id) {
    const fields = getFormFields(model);
    const fnames = fields.map(f => typeof f === 'object' ? f.name : f);
    return rpc.callKw(model, 'read', [[parseInt(id, 10)], fnames]);
  }

  function getHashViewParam() {
    const hash = (window.location.hash || '').slice(1);
    const q = hash.indexOf('?');
    if (q < 0) return null;
    const params = new URLSearchParams(hash.slice(q + 1));
    return params.get('view') || null;
  }

  function getAvailableViewModes(route) {
    if (!viewsSvc) return ['list'];
    const menus = viewsSvc.getMenus() || [];
    for (let i = 0; i < menus.length; i++) {
      const action = menus[i].action ? viewsSvc.getAction(menus[i].action) : null;
      if (action && actionToRoute(action) === route) {
        const raw = action.view_mode || action.viewMode || 'list,form';
        const modes = Array.isArray(raw) ? raw : String(raw).split(/[,\s]+/).filter(Boolean);
        return modes.length ? modes : ['list'];
      }
    }
    return ['list'];
  }

  function getPreferredViewType(route) {
    const urlView = getHashViewParam();
    if (urlView) return urlView;
    try {
      const stored = sessionStorage.getItem('view_' + route);
      if (stored) return stored;
    } catch (e) {}
    const modes = getAvailableViewModes(route);
    return modes[0] || 'list';
  }

  function setViewAndReload(route, view) {
    try {
      sessionStorage.setItem('view_' + route, view);
    } catch (e) {}
    window.location.hash = route + (view && view !== 'list' ? '?view=' + view : '');
  }

  function loadRecords(model, route, searchTerm, stageFilter, viewTypeOverride, savedFilterId) {
    const viewType = viewTypeOverride != null ? viewTypeOverride : getPreferredViewType(route);
    const cols = getListColumns(model);
    const fnames = cols.map(c => typeof c === 'object' ? c.name : c);
    const fields = ['id'].concat(fnames);
    const title = getTitle(route);
    if (stageFilter === undefined && currentListState.route === route) stageFilter = currentListState.stageFilter;
    if (savedFilterId === undefined && currentListState.route === route) savedFilterId = currentListState.savedFilterId;
    const action = getActionForRoute(route);
    const actionDomain = action ? parseActionDomain(action.domain || '') : [];
    let domain = actionDomain.slice();
    const savedFilters = getSavedFilters(model);
    const savedFilter = savedFilterId ? savedFilters.find(function (f) { return f.id === savedFilterId; }) : null;
    if (savedFilter && savedFilter.domain && savedFilter.domain.length) {
      domain = domain.concat(savedFilter.domain);
    } else {
      const searchDom = buildSearchDomain(model, searchTerm && searchTerm.trim() ? searchTerm.trim() : '');
      if (searchDom.length) domain = domain.concat(searchDom);
      if (model === 'crm.lead' && stageFilter) domain = domain.concat([['stage_id', '=', stageFilter]]);
    }
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: viewType, savedFilterId: savedFilterId || null };
    main.innerHTML = '<h2>' + title + '</h2><p>Loading...</p>';
    rpc.callKw(model, 'search_read', [domain], { fields: fields, limit: 100 })
      .then(records => {
        if (viewType === 'kanban' && model === 'crm.lead' && window.ViewRenderers && window.ViewRenderers.kanban) {
          renderKanban(model, route, records, searchTerm);
        } else {
          renderList(model, route, records, searchTerm);
        }
      })
      .catch(err => {
        main.innerHTML = '<h2>' + title + '</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load') + '</p>';
      });
  }

  function renderKanban(model, route, records, searchTerm) {
    const title = getTitle(route);
    const addLabel = route === 'leads' ? 'Add lead' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = (currentListState.route === route && currentListState.viewType) || 'kanban';
    const kanbanView = viewsSvc && viewsSvc.getView(model, 'kanban');
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += renderViewSwitcher(route, currentView);
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p>';
    html += '<div id="kanban-area"></div>';
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: currentView };
    main.querySelectorAll('.btn-view').forEach(btn => {
      btn.onclick = () => { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = () => { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = () => {
        const filterEl = document.getElementById('list-stage-filter');
        const val = filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    if (model === 'crm.lead') {
      const filterEl = document.getElementById('list-stage-filter');
      if (filterEl) {
        rpc.callKw('crm.stage', 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence' })
          .then(function (stages) {
            stages.forEach(function (s) {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name || '';
              if (s.id === stageFilter) opt.selected = true;
              filterEl.appendChild(opt);
            });
            filterEl.onchange = function () {
              const val = filterEl.value ? parseInt(filterEl.value, 10) : null;
              loadRecords(model, route, searchInput.value.trim(), val);
            };
          });
      }
    }
    const stageIds = [];
    (records || []).forEach(r => { if (r.stage_id) stageIds.push(r.stage_id); });
    const uniq = stageIds.filter((x, i, a) => a.indexOf(x) === i);
    const nameMap = {};
    if (uniq.length) {
      rpc.callKw('crm.stage', 'read', [uniq, ['id', 'name']])
        .then(stages => {
          stages.forEach(s => { nameMap[s.id] = s.name; });
          window.ViewRenderers.kanban(document.getElementById('kanban-area'), model, records, {
            default_group_by: (kanbanView && kanbanView.default_group_by) || 'stage_id',
            fields: (kanbanView && kanbanView.fields) || ['name', 'expected_revenue'],
            stageNames: nameMap,
            onCardClick: (id) => { window.location.hash = route + '/edit/' + id; },
            onStageChange: (recordId, newStageId) => {
              const stageVal = newStageId || false;
              rpc.callKw(model, 'write', [[parseInt(recordId, 10)], { stage_id: stageVal }])
                .then(() => loadRecords(model, route, currentListState.searchTerm))
                .catch(err => alert(err.message || 'Failed to update stage'));
            }
          });
        })
        .catch(() => {
          window.ViewRenderers.kanban(document.getElementById('kanban-area'), model, records, {
            default_group_by: 'stage_id',
            stageNames: {},
            onCardClick: (id) => { window.location.hash = route + '/edit/' + id; }
          });
        });
    } else {
      window.ViewRenderers.kanban(document.getElementById('kanban-area'), model, records, {
        default_group_by: 'stage_id',
        stageNames: {},
        onCardClick: (id) => { window.location.hash = route + '/edit/' + id; }
      });
    }
  }

  function route() {
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    const editMatch = hash.match(/^(contacts|leads)\/edit\/(\d+)$/);
    const newMatch = hash.match(/^(contacts|leads)\/new$/);
    const listMatch = base.match(/^(contacts|leads)$/);
    const settingsApiKeysMatch = hash.match(/^settings\/apikeys$/);
    const settingsIndexMatch = hash.match(/^settings\/?$/);

    if (settingsApiKeysMatch) {
      renderApiKeysSettings();
    } else if (settingsIndexMatch) {
      renderSettingsStub();
    } else if (listMatch) {
      const route = listMatch[1];
      const model = getModelForRoute(route);
      if (model) loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '');
      else renderHome();
    } else if (newMatch) {
      const route = newMatch[1];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route);
      else renderHome();
    } else if (editMatch) {
      const route = editMatch[1], id = editMatch[2];
      const model = getModelForRoute(route);
      if (model) renderForm(model, route, id);
      else renderHome();
    } else {
      renderHome();
    }
  }

  window.addEventListener('hashchange', route);

  (function init() {
    const p = viewsSvc ? viewsSvc.load() : Promise.resolve();
    p.then(function () {
      renderNavbar();
      route();
    });
  })();
})();
