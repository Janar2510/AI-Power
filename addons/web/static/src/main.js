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
    return m || null;
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

  function getListColumns() {
    if (viewsSvc) {
      const v = viewsSvc.getView('res.partner', 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => c.name || c);
    }
    return ['name', 'email', 'phone', 'city'];
  }

  function getFormFields() {
    if (viewsSvc) {
      const v = viewsSvc.getView('res.partner', 'form');
      if (v && v.fields && v.fields.length) return v.fields.map(f => f.name || f);
    }
    return ['name', 'email', 'phone', 'city'];
  }

  String.prototype.escapeHtml = function () {
    const div = document.createElement('div');
    div.textContent = this;
    return div.innerHTML;
  };

  function renderHome() {
    main.innerHTML = '<h2>Welcome</h2><p>Use the menu to navigate. <strong>Contacts</strong> shows your contact list.</p>';
  }

  function renderContacts(contacts) {
    const cols = getListColumns();
    let html = '<h2>Contacts</h2>';
    html += '<p><button type="button" id="btn-add-contact" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add contact</button></p>';
    if (!contacts || !contacts.length) {
      main.innerHTML = html + '<p>No contacts yet.</p>';
    } else {
      html += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
      cols.forEach(c => { html += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">' + c + '</th>'; });
      html += '<th></th></tr></thead><tbody>';
      contacts.forEach(r => {
        html += '<tr data-id="' + (r.id || '') + '">';
        cols.forEach(c => { html += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (r[c] || '').toString().escapeHtml() + '</td>'; });
        html += '<td style="padding:0.5rem"><a href="#contacts/edit/' + (r.id || '') + '" style="font-size:0.9rem;margin-right:0.5rem">Edit</a>';
        html += '<a href="#" class="btn-delete" data-id="' + (r.id || '') + '" style="font-size:0.9rem;color:#c00">Delete</a></td></tr>';
      });
      html += '</tbody></table>';
      main.innerHTML = html;
    }
    const btn = document.getElementById('btn-add-contact');
    if (btn) btn.onclick = () => { window.location.hash = 'contacts/new'; };
    main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); if (confirm('Delete this contact?')) deleteContact(a.dataset.id); };
    });
  }

  function deleteContact(id) {
    rpc.callKw('res.partner', 'unlink', [[parseInt(id, 10)]])
      .then(() => loadContacts())
      .catch(err => { alert(err.message || 'Failed to delete'); });
  }

  function renderContactForm(id) {
    const isNew = !id;
    const title = isNew ? 'New contact' : 'Edit contact';
    const fields = getFormFields();
    let html = '<h2>' + title + '</h2><form id="contact-form" style="max-width:400px">';
    fields.forEach(f => {
      const required = f === 'name';
      const inputType = f === 'email' ? 'email' : 'text';
      html += '<p><label>' + f + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + f + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
    });
    html += '<p><button type="submit" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Save</button> ';
    html += '<a href="#contacts" style="margin-left:0.5rem">Cancel</a></p></form>';
    main.innerHTML = html;
    const form = document.getElementById('contact-form');
    if (isNew) {
      form.onsubmit = (e) => { e.preventDefault(); createContact(form); return false; };
    } else {
      loadContact(id).then(r => {
        if (r && r[0]) {
          const set = (n, v) => { const el = form.querySelector('[name="' + n + '"]'); if (el) el.value = v != null ? v : ''; };
          fields.forEach(n => set(n, r[0][n]));
        }
      }).catch(() => {});
      form.onsubmit = (e) => { e.preventDefault(); updateContact(id, form); return false; };
    }
  }

  function getFormVals(form) {
    const fields = getFormFields();
    const byName = (n) => (form.querySelector('[name="' + n + '"]') || {}).value || '';
    const vals = {};
    fields.forEach(n => { vals[n] = byName(n).trim(); });
    return vals;
  }

  function createContact(form) {
    const vals = getFormVals(form);
    if (!vals.name) {
      showFormError(form, 'Please enter a name.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw('res.partner', 'create', [[vals]])
      .then(() => { window.location.hash = 'contacts'; loadContacts(); })
      .catch(err => {
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        const msg = err.message || 'Failed to save';
        if (msg.indexOf('Session expired') >= 0) {
          window.location.href = '/web/login';
          return;
        }
        showFormError(form, msg);
        alert('Could not save: ' + msg);
      });
  }

  function showFormError(form, msg) {
    const prev = form.querySelector('.error');
    if (prev) prev.remove();
    form.insertAdjacentHTML('beforeend', '<p class="error" style="color:#c00;margin-top:0.5rem">' + msg.replace(/</g, '&lt;') + '</p>');
  }

  function updateContact(id, form) {
    const vals = getFormVals(form);
    if (!vals.name) {
      showFormError(form, 'Please enter a name.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw('res.partner', 'write', [[parseInt(id, 10)], vals])
      .then(() => { window.location.hash = 'contacts'; loadContacts(); })
      .catch(err => {
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
        const msg = err.message || 'Failed to save';
        if (msg.indexOf('Session expired') >= 0) {
          window.location.href = '/web/login';
          return;
        }
        showFormError(form, msg);
      });
  }

  function loadContact(id) {
    const fields = getFormFields();
    return rpc.callKw('res.partner', 'read', [[parseInt(id, 10)], fields]);
  }

  function loadContacts() {
    const cols = getListColumns();
    const fields = ['id'].concat(cols);
    main.innerHTML = '<h2>Contacts</h2><p>Loading...</p>';
    rpc.callKw('res.partner', 'search_read', [[]], { fields: fields, limit: 100 })
      .then(renderContacts)
      .catch(err => {
        main.innerHTML = '<h2>Contacts</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load') + '</p>';
      });
  }

  function route() {
    const hash = (window.location.hash || '#home').slice(1);
    const m = hash.match(/^contacts\/edit\/(\d+)$/);
    if (hash === 'contacts') loadContacts();
    else if (hash === 'contacts/new') renderContactForm();
    else if (m) renderContactForm(m[1]);
    else renderHome();
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
