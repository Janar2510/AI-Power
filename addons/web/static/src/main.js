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
    if (!navbar || !viewsSvc) return;
    const menus = (viewsSvc.getMenus() || []).slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    let html = '<span class="logo">ERP Platform</span><nav class="nav-menu">';
    menus.forEach(function (m) {
      const action = m.action ? viewsSvc.getAction(m.action) : null;
      const route = action ? actionToRoute(action) : (m.name && m.name.toLowerCase() === 'home' ? 'home' : null);
      const href = route ? '#' + route : '#';
      const cls = 'nav-link' + (route ? '' : ' nav-link-disabled');
      html += '<a href="' + href + '" class="' + cls + '" data-menu-id="' + (m.id || '').replace(/"/g, '&quot;') + '">' + (m.name || '').replace(/</g, '&lt;') + '</a>';
    });
    html += '</nav>';
    navbar.innerHTML = html;
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    return model === 'crm.lead' ? ['name', 'stage', 'expected_revenue'] : ['name', 'email', 'phone', 'city'];
  }

  function getFormFields(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'form');
      if (v && v.fields && v.fields.length) return v.fields.map(f => (typeof f === 'object' ? f.name : f) || f);
    }
    return model === 'crm.lead' ? ['name', 'stage', 'expected_revenue', 'description'] : ['name', 'email', 'phone', 'street', 'city', 'country'];
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

  function renderList(model, route, records) {
    const cols = getListColumns(model);
    const title = getTitle(route);
    const addLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : 'Add';
    let html = '<h2>' + title + '</h2>';
    html += '<p><button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p>';
    if (!records || !records.length) {
      main.innerHTML = html + '<p>No records yet.</p>';
    } else {
      html += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
      cols.forEach(c => { html += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">' + (typeof c === 'object' ? c.name || c : c) + '</th>'; });
      html += '<th></th></tr></thead><tbody>';
      records.forEach(r => {
        html += '<tr data-id="' + (r.id || '') + '">';
        cols.forEach(c => {
          const f = typeof c === 'object' ? c.name : c;
          html += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (r[f] != null ? String(r[f]) : '').replace(/</g, '&lt;') + '</td>';
        });
        html += '<td style="padding:0.5rem"><a href="#' + route + '/edit/' + (r.id || '') + '" style="font-size:0.9rem;margin-right:0.5rem">Edit</a>';
        html += '<a href="#" class="btn-delete" data-id="' + (r.id || '') + '" style="font-size:0.9rem;color:#c00">Delete</a></td></tr>';
      });
      html += '</tbody></table>';
      main.innerHTML = html;
    }
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = () => { window.location.hash = route + '/new'; };
    main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); if (confirm('Delete this record?')) deleteRecord(model, route, a.dataset.id); };
    });
  }

  function deleteRecord(model, route, id) {
    rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(() => loadRecords(model, route))
      .catch(err => { alert(err.message || 'Failed to delete'); });
  }

  function renderForm(model, route, id) {
    const fields = getFormFields(model);
    const title = getTitle(route);
    const isNew = !id;
    const formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    let html = '<h2>' + formTitle + '</h2><form id="record-form" style="max-width:400px">';
    fields.forEach(f => {
      const fname = typeof f === 'object' ? f.name : f;
      const required = fname === 'name';
      const inputType = fname === 'email' ? 'email' : fname === 'description' ? 'textarea' : 'text';
      if (inputType === 'textarea') {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
      } else {
        html += '<p><label>' + fname + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
      }
    });
    html += '<p><button type="submit" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Save</button> ';
    html += '<a href="#' + route + '" style="margin-left:0.5rem">Cancel</a></p></form>';
    main.innerHTML = html;
    const form = document.getElementById('record-form');
    if (isNew) {
      form.onsubmit = (e) => { e.preventDefault(); createRecord(model, route, form); return false; };
    } else {
      loadRecord(model, id).then(r => {
        if (r && r[0]) {
          const set = (n, v) => { const el = form.querySelector('[name="' + n + '"]'); if (el) el.value = v != null ? v : ''; };
          fields.forEach(f => { const n = typeof f === 'object' ? f.name : f; set(n, r[0][n]); });
        }
      }).catch(() => {});
      form.onsubmit = (e) => { e.preventDefault(); updateRecord(model, route, id, form); return false; };
    }
  }

  function getFormVals(form, model) {
    const fields = getFormFields(model);
    const byName = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    const vals = {};
    fields.forEach(f => { const n = typeof f === 'object' ? f.name : f; vals[n] = byName(n).trim(); });
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
      .then(() => { window.location.hash = route; loadRecords(model, route); })
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
      .then(() => { window.location.hash = route; loadRecords(model, route); })
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

  function loadRecords(model, route) {
    const cols = getListColumns(model);
    const fnames = cols.map(c => typeof c === 'object' ? c.name : c);
    const fields = ['id'].concat(fnames);
    const title = getTitle(route);
    main.innerHTML = '<h2>' + title + '</h2><p>Loading...</p>';
    rpc.callKw(model, 'search_read', [[]], { fields: fields, limit: 100 })
      .then(records => renderList(model, route, records))
      .catch(err => {
        main.innerHTML = '<h2>' + title + '</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load') + '</p>';
      });
  }

  function route() {
    const hash = (window.location.hash || '#home').slice(1);
    const editMatch = hash.match(/^(contacts|leads)\/edit\/(\d+)$/);
    const newMatch = hash.match(/^(contacts|leads)\/new$/);
    const listMatch = hash.match(/^(contacts|leads)$/);

    if (listMatch) {
      const route = listMatch[1];
      const model = getModelForRoute(route);
      if (model) loadRecords(model, route);
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
