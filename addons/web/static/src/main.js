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

  /** Get model name for route slug (inverse of actionToRoute) */
  function getModelForRoute(route) {
    if (!viewsSvc) return null;
    const menus = viewsSvc.getMenus() || [];
    for (let i = 0; i < menus.length; i++) {
      const action = menus[i].action ? viewsSvc.getAction(menus[i].action) : null;
      if (action && actionToRoute(action) === route) return action.res_model || action.resModel;
    }
    if (route === 'contacts') return 'res.partner';
    if (route === 'leads') return 'crm.lead';
    return null;
  }

  function renderNavbar() {
    if (!navbar) return;
    let html = '<span class="logo">ERP Platform</span><nav class="nav-menu">';
    if (viewsSvc) {
      const menus = (viewsSvc.getMenus() || []).slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      menus.forEach(function (m) {
        const action = m.action ? viewsSvc.getAction(m.action) : null;
        const route = action ? actionToRoute(action) : (m.name && m.name.toLowerCase() === 'home' ? 'home' : null);
        const href = route ? '#' + route : '#';
        const cls = 'nav-link' + (route ? '' : ' nav-link-disabled');
        html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
      });
    }
    html += '</nav><span class="nav-user">';
    html += '<a href="#settings/apikeys" class="nav-link">API Keys</a>';
    html += '<a href="/web/logout" class="nav-link">Logout</a>';
    html += '</span>';
    navbar.innerHTML = html;
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    return model === 'crm.lead' ? ['name', 'type', 'stage_id', 'expected_revenue'] : ['name', 'email', 'phone', 'city'];
  }

  function getFormFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'form');
      if (v && v.fields && v.fields.length) return v.fields.map(f => (typeof f === 'object' ? f.name : f) || f);
    }
    return model === 'crm.lead' ? ['name', 'type', 'partner_id', 'stage_id', 'expected_revenue', 'description', 'activity_ids'] : ['name', 'email', 'phone', 'street', 'city', 'country'];
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
    if (!comodel) return {};
    const ids = [];
    records.forEach(function (r) { const v = r[colName]; if (v) ids.push(v); });
    if (!ids.length) return {};
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    const map = {};
    return rpc.callKw(comodel, 'read', [uniq, ['id', 'name']])
      .then(function (rows) {
        rows.forEach(function (row) { map[row.id] = row.name || row.id; });
        return map;
      })
      .catch(function () { return {}; });
  }

  function renderList(model, route, records, searchTerm) {
    const cols = getListColumns(model);
    const title = getTitle(route);
    const addLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
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
      function renderTable(nameMap) {
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(c => { tbl += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">' + (typeof c === 'object' ? c.name || c : c) + '</th>'; });
        tbl += '<th></th></tr></thead><tbody>';
        records.forEach(r => {
          tbl += '<tr data-id="' + (r.id || '') + '">';
          cols.forEach(c => {
            const f = typeof c === 'object' ? c.name : c;
            let val = r[f];
            if (nameMap && nameMap[f] && val != null) val = nameMap[f][val] || val;
            else if (val != null) {
              const selLabel = getSelectionLabel(model, f, val);
              if (selLabel !== val) val = selLabel;
            }
            tbl += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (val != null ? String(val) : '').replace(/</g, '&lt;') + '</td>';
          });
          tbl += '<td style="padding:0.5rem"><a href="#' + route + '/edit/' + (r.id || '') + '" style="font-size:0.9rem;margin-right:0.5rem">Edit</a>';
          tbl += '<a href="#" class="btn-delete" data-id="' + (r.id || '') + '" style="font-size:0.9rem;color:#c00">Delete</a></td></tr>';
        });
        tbl += '</tbody></table>';
        main.innerHTML = html + tbl;
      }
      if (m2oCols.length) {
        Promise.all(m2oCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        })).then(function (maps) {
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
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), currentListState.stageFilter); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); if (confirm('Delete this record?')) deleteRecord(model, route, a.dataset.id); };
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
              loadRecords(model, route, document.getElementById('list-search').value.trim(), val);
            };
          });
      }
    }
  }

  let currentListState = { model: null, route: null, searchTerm: '' };

  function deleteRecord(model, route, id) {
    rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(() => loadRecords(model, route, currentListState.searchTerm))
      .catch(err => { alert(err.message || 'Failed to delete'); });
  }

  function getMany2oneComodel(model, fname) {
    if (model === 'crm.lead' && fname === 'partner_id') return 'res.partner';
    if (model === 'crm.lead' && fname === 'stage_id') return 'crm.stage';
    return null;
  }

  function getSelectionOptions(model, fname) {
    if (model === 'crm.lead' && fname === 'type') return [['lead', 'Lead'], ['opportunity', 'Opportunity']];
    return null;
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

  function renderForm(model, route, id) {
    const fields = getFormFields(model);
    const title = getTitle(route);
    const isNew = !id;
    const formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    let html = '<h2>' + formTitle + '</h2><form id="record-form" style="max-width:400px">';
    fields.forEach(f => {
      const fname = typeof f === 'object' ? f.name : f;
      const o2m = getOne2manyInfo(model, fname);
      if (o2m) {
        html += '<p><label>' + fname + '</label><div id="o2m-' + fname + '" data-comodel="' + (o2m.comodel || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em"></div></p>';
        return;
      }
      const required = fname === 'name';
      const comodel = getMany2oneComodel(model, fname);
      const selectionOpts = getSelectionOptions(model, fname);
      const inputType = fname === 'email' ? 'email' : fname === 'description' ? 'textarea' : selectionOpts ? 'selection' : (comodel ? 'many2one' : 'text');
      if (inputType === 'textarea') {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
      } else if (inputType === 'selection') {
        let opts = '<option value="">--</option>';
        selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem">' + opts + '</select></label></p>';
      } else if (inputType === 'many2one') {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem" data-comodel="' + (comodel || '') + '"><option value="">--</option></select></label></p>';
      } else {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
      }
    });
    html += '<p><button type="submit" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Save</button> ';
    html += '<a href="#' + route + '" style="margin-left:0.5rem">Cancel</a></p></form>';
    main.innerHTML = html;
    const form = document.getElementById('record-form');
    const selects = form.querySelectorAll('select[data-comodel]');
    const loadOptions = function () {
      const promises = [];
      selects.forEach(function (sel) {
        const comodel = sel.dataset.comodel;
        if (!comodel) return;
        promises.push(
          rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], limit: 200 })
            .then(function (opts) {
              opts.forEach(function (o) {
                sel.appendChild(document.createElement('option')).value = o.id;
                sel.lastChild.textContent = o.name || o.id;
              });
            })
        );
      });
      return Promise.all(promises);
    };
    if (isNew) {
      loadOptions();
      form.onsubmit = (e) => { e.preventDefault(); createRecord(model, route, form); return false; };
    } else {
      loadOptions().then(function () {
        return loadRecord(model, id);
      }).then(function (r) {
        if (r && r[0]) {
          const rec = r[0];
          const set = (n, v) => { const el = form.querySelector('[name="' + n + '"]'); if (el) el.value = v != null ? v : ''; };
          fields.forEach(f => {
            const n = typeof f === 'object' ? f.name : f;
            const o2m = getOne2manyInfo(model, n);
            if (o2m) {
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
            } else {
              set(n, rec[n]);
            }
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

  function getPreferredViewType(route) {
    if (!viewsSvc) return 'list';
    const menus = viewsSvc.getMenus() || [];
    for (let i = 0; i < menus.length; i++) {
      const action = menus[i].action ? viewsSvc.getAction(menus[i].action) : null;
      if (action && actionToRoute(action) === route) {
        const modes = action.view_mode || ['list', 'form'];
        return modes[0] || 'list';
      }
    }
    return 'list';
  }

  function loadRecords(model, route, searchTerm, stageFilter) {
    const viewType = getPreferredViewType(route);
    const cols = getListColumns(model);
    const fnames = cols.map(c => typeof c === 'object' ? c.name : c);
    const fields = ['id'].concat(fnames);
    const title = getTitle(route);
    if (stageFilter === undefined && currentListState.route === route) {
      stageFilter = currentListState.stageFilter;
    }
    let domain = (searchTerm && searchTerm.trim()) ? [['name', 'ilike', searchTerm.trim()]] : [];
    if (model === 'crm.lead' && stageFilter) {
      domain = domain.concat([['stage_id', '=', stageFilter]]);
    }
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter };
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
    const kanbanView = viewsSvc && viewsSvc.getView(model, 'kanban');
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p>';
    html += '<div id="kanban-area"></div>';
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter };
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
    const editMatch = hash.match(/^(contacts|leads)\/edit\/(\d+)$/);
    const newMatch = hash.match(/^(contacts|leads)\/new$/);
    const listMatch = hash.match(/^(contacts|leads)$/);
    const settingsMatch = hash.match(/^settings\/apikeys$/);

    if (settingsMatch) {
      renderApiKeysSettings();
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
