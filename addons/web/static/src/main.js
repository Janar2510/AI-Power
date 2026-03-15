/**
 * ERP Platform Web Client - Data-driven menus, actions, list/form views
 */
(function () {
  const main = document.getElementById('action-manager');
  const navbar = document.getElementById('navbar');
  if (!main) return;

  function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;
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

  const rpc = window.Services && window.Services.rpc ? window.Services.rpc : (window.Session || { callKw: () => Promise.reject(new Error('RPC not loaded')) });
  const viewsSvc = window.Services && window.Services.views ? window.Services.views : null;

  var actionStack = [];
  var formDirty = false;
  var lastHash = (window.location.hash || '#home').slice(1);

  function pushBreadcrumb(label, hash) {
    actionStack.push({ label: label, hash: hash });
  }

  function popBreadcrumbTo(index) {
    if (index < actionStack.length) {
      actionStack = actionStack.slice(0, index + 1);
      var entry = actionStack[actionStack.length - 1];
      if (entry) window.location.hash = entry.hash;
    }
  }

  function renderBreadcrumbs() {
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

  /** Map act_window res_model to hash route (convention: res.partner -> contacts) */
  function actionToRoute(action) {
    if (!action || action.type !== 'ir.actions.act_window') return null;
    const m = (action.res_model || '').replace(/\./g, '_');
    if (m === 'res_partner') return 'contacts';
    if (m === 'crm_lead') return 'leads';
    if (m === 'sale_order') return 'orders';
    if (m === 'product_product') return 'products';
    if (m === 'ir_attachment') return 'attachments';
    if (m === 'res_users') return 'settings/users';
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
    if (route === 'orders') return 'sale.order';
    if (route === 'products') return 'product.product';
    if (route === 'attachments') return 'ir.attachment';
    if (route === 'settings/users') return 'res.users';
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

  function parseFilterDomain(s) {
    if (!s || typeof s !== 'string') return [];
    const t = s.trim();
    if (!t) return [];
    try {
      const json = t.replace(/\(/g, '[').replace(/\)/g, ']').replace(/'/g, '"');
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
    return [];
  }

  function parseCSV(text) {
    const rows = [];
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const row = [];
      let cur = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
          row.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      row.push(cur.trim());
      if (row.some(function (c) { return c; })) rows.push(row);
    }
    return rows;
  }

  function showImportModal(model, route) {
    const cols = getListColumns(model);
    const modelFields = ['id'].concat(cols.map(function (c) { return typeof c === 'object' ? c.name : c; }));
    const overlay = document.createElement('div');
    overlay.id = 'import-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
    let html = '<div id="import-modal" style="background:white;border-radius:8px;padding:var(--space-lg);max-width:600px;width:90%;max-height:90vh;overflow:auto">';
    html += '<h3 style="margin-top:0">Import CSV</h3>';
    html += '<p><input type="file" id="import-file" accept=".csv" style="padding:0.5rem"></p>';
    html += '<div id="import-preview" style="display:none;margin:1rem 0">';
    html += '<p><strong>Preview (first 5 rows)</strong></p>';
    html += '<div id="import-preview-table"></div>';
    html += '<p><strong>Column mapping</strong></p>';
    html += '<div id="import-mapping"></div>';
    html += '<p style="margin-top:1rem"><button type="button" id="import-do-btn" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Import</button>';
    html += ' <button type="button" id="import-cancel-btn" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Cancel</button></p>';
    html += '</div>';
    html += '<div id="import-result" style="display:none"></div>';
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    let csvHeaders = [];
    let csvRows = [];
    const fileInput = document.getElementById('import-file');
    fileInput.onchange = function () {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = function () {
        const parsed = parseCSV(r.result || '');
        if (!parsed.length) { showToast('No rows in CSV', 'error'); return; }
        csvHeaders = parsed[0];
        csvRows = parsed.slice(1);
        const preview = csvRows.slice(0, 5);
        let tbl = '<table style="width:100%;border-collapse:collapse;font-size:0.9rem"><tr>';
        csvHeaders.forEach(function (h) { tbl += '<th style="padding:0.35rem;border:1px solid #ddd;text-align:left">' + String(h).replace(/</g, '&lt;') + '</th>'; });
        tbl += '</tr>';
        preview.forEach(function (row) {
          tbl += '<tr>';
          row.forEach(function (c) { tbl += '<td style="padding:0.35rem;border:1px solid #eee">' + String(c || '').replace(/</g, '&lt;') + '</td>'; });
          tbl += '</tr>';
        });
        tbl += '</table>';
        document.getElementById('import-preview-table').innerHTML = tbl;
        let mapHtml = '<table style="width:100%"><tr><th>CSV column</th><th>Map to field</th></tr>';
        csvHeaders.forEach(function (h, i) {
          mapHtml += '<tr><td style="padding:0.35rem">' + String(h).replace(/</g, '&lt;') + '</td><td><select class="import-map-select" data-csv-idx="' + i + '" style="width:100%;padding:0.35rem">';
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
        document.getElementById('import-preview').style.display = 'block';
      };
      r.readAsText(f);
    };
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
      const orderedRows = csvRows.map(function (row) {
        return fields.map(function (f) {
          for (let i = 0; i < csvHeaders.length; i++) {
            if (csvIdxToField[i] === f) return row[i] != null ? String(row[i]).trim() : '';
          }
          return '';
        });
      });
      rpc.callKw(model, 'import_data', [fields, orderedRows], {})
        .then(function (res) {
          document.getElementById('import-preview').style.display = 'none';
          const r = document.getElementById('import-result');
          r.style.display = 'block';
          r.innerHTML = '<p><strong>Import complete</strong></p><p>Created: ' + (res.created || 0) + ', Updated: ' + (res.updated || 0) + '</p>';
          if (res.errors && res.errors.length) {
            r.innerHTML += '<p style="color:#c00">Errors:</p><table style="width:100%;font-size:0.9rem"><tr><th>Row</th><th>Field</th><th>Message</th></tr>';
            res.errors.forEach(function (e) {
              r.innerHTML += '<tr><td>' + (e.row || '') + '</td><td>' + (e.field || '').replace(/</g, '&lt;') + '</td><td>' + (e.message || '').replace(/</g, '&lt;') + '</td></tr>';
            });
            r.innerHTML += '</table>';
          }
          r.innerHTML += '<p><button type="button" id="import-close-btn" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Close</button></p>';
          document.getElementById('import-close-btn').onclick = function () {
            overlay.remove();
            loadRecords(model, route, currentListState.searchTerm);
          };
          if (!res.errors || !res.errors.length) {
            showToast('Imported ' + (res.created || 0) + ' created, ' + (res.updated || 0) + ' updated', 'success');
            setTimeout(function () {
              overlay.remove();
              loadRecords(model, route, currentListState.searchTerm);
            }, 1500);
          }
        })
        .catch(function (err) {
          showToast(err.message || 'Import failed', 'error');
        });
    };
    document.getElementById('import-cancel-btn').onclick = function () { overlay.remove(); };
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

  function renderNavbar(userCompanies, userLangs, currentLang) {
    if (!navbar) return;
    userLangs = userLangs || [];
    currentLang = currentLang || 'en_US';
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
    html += '</nav><span class="nav-user" style="margin-left:auto;display:flex;align-items:center;gap:0.75rem">';
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
    html += '<a href="/web/logout" class="nav-link">Logout</a>';
    html += '</span>';
    navbar.innerHTML = html;
    navbar.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      const label = dd.querySelector('a') || dd.querySelector('button');
      const content = dd.querySelector('.nav-dropdown-content');
      if (label && content) {
        label.onmouseenter = function () { content.style.display = 'block'; };
        dd.onmouseleave = function () { content.style.display = 'none'; };
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
  }

  function getListColumns(model) {
    if (viewsSvc && model) {
      const v = viewsSvc.getView(model, 'list');
      if (v && v.columns && v.columns.length) return v.columns.map(c => (typeof c === 'object' ? c.name : c) || c);
    }
    if (model === 'crm.lead') return ['name', 'type', 'stage_id', 'date_deadline', 'expected_revenue', 'tag_ids'];
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
    const reportMap = { 'crm.lead': 'crm.lead_summary' };
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
    if (model === 'crm.lead') return ['name', 'type', 'partner_id', 'stage_id', 'currency_id', 'expected_revenue', 'description', 'note_html', 'tag_ids', 'activity_ids', 'message_ids'];
    if (model === 'sale.order') return ['name', 'partner_id', 'date_order', 'state', 'currency_id', 'amount_total', 'order_line'];
    if (model === 'product.product') return ['name', 'list_price'];
    if (model === 'res.users') return ['name', 'login', 'active', 'group_ids'];
    if (model === 'ir.attachment') return ['name', 'res_model', 'res_id', 'datas'];
    return ['name', 'is_company', 'type', 'email', 'phone', 'street', 'street2', 'city', 'zip', 'country_id', 'state_id'];
  }

  function getTitle(route) {
    if (route === 'contacts') return 'Contacts';
    if (route === 'leads') return 'Leads';
    if (route === 'orders') return 'Orders';
    if (route === 'products') return 'Products';
    if (route === 'attachments') return 'Attachments';
    if (route === 'settings/users') return 'Users';
    return route ? (route.charAt(0).toUpperCase() + route.slice(1)) : 'Records';
  }

  String.prototype.escapeHtml = function () {
    const div = document.createElement('div');
    div.textContent = this;
    return div.innerHTML;
  };

  function renderHome() {
    if (typeof window !== 'undefined') window.chatContext = {};
    renderDashboard();
  }

  function renderDashboard() {
    actionStack = [];
    main.innerHTML = '<h2>Dashboard</h2><div id="dashboard-kpis" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--space-md);margin:var(--space-lg) 0"></div><div id="dashboard-activity" style="margin-top:var(--space-lg)"></div><div id="dashboard-shortcuts" style="margin-top:var(--space-lg)"></div><div id="dashboard-recent" style="margin-top:var(--space-lg)"></div>';
    rpc.callKw('ir.dashboard.widget', 'search_read', [[]], { fields: ['id', 'name', 'model', 'domain'], order: 'sequence' })
      .then(function (widgets) {
        if (!widgets || !widgets.length) return;
        const ids = widgets.map(function (w) { return w.id; });
        return rpc.callKw('ir.dashboard.widget', 'get_data', [ids], {}).then(function (data) {
          const container = document.getElementById('dashboard-kpis');
          if (!container) return;
          let html = '';
          (data || []).forEach(function (d, i) {
            const w = widgets[i];
            const route = w.model === 'crm.lead' ? 'leads' : (w.model === 'res.partner' ? 'contacts' : null);
            let href = route ? '#leads' : '#';
            if (route === 'contacts') href = '#contacts';
            else if (route === 'leads' && d.domain && Array.isArray(d.domain) && d.domain.length) {
              href = '#leads?domain=' + encodeURIComponent(JSON.stringify(d.domain));
            } else if (route) href = '#' + route;
            const val = typeof d.value === 'number' ? (d.value % 1 === 0 ? d.value : d.value.toFixed(1)) : d.value;
            html += '<a href="' + href + '" class="o-card o-card-gradient" style="display:block;padding:var(--space-lg);border-radius:var(--radius-md);text-decoration:none;color:inherit;border:1px solid var(--border-color)">';
            html += '<div style="font-size:1.75rem;font-weight:700">' + (val || '0') + '</div>';
            html += '<div style="font-size:0.9rem;color:var(--text-muted)">' + (d.name || '').replace(/</g, '&lt;') + '</div></a>';
          });
          container.innerHTML = html;
        });
      })
      .catch(function () {});
    (function loadActivities() {
      var uidPromise = (window.Services && window.Services.session) ? window.Services.session.getSessionInfo() : Promise.resolve({ uid: 1 });
      uidPromise.then(function (info) {
        var u = (info && info.uid) || 1;
        return rpc.callKw('mail.activity', 'search_read', [[['user_id', '=', u]]], { fields: ['res_model', 'res_id', 'summary', 'date_deadline', 'state'], limit: 10 });
      }).then(function (activities) {
        const container = document.getElementById('dashboard-activity');
        if (!container) return;
        container.innerHTML = '<h3 style="margin:0 0 var(--space-sm)">Upcoming Activities</h3>';
        if (!activities || !activities.length) {
          container.innerHTML += '<p style="color:var(--text-muted)">No upcoming activities.</p>';
          return;
        }
        activities.forEach(function (a) {
          container.innerHTML += '<div style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)">' + (a.summary || 'Activity').replace(/</g, '&lt;') + ' &middot; ' + (a.date_deadline || '').replace(/</g, '&lt;') + '</div>';
        });
      }).catch(function () {
        const c = document.getElementById('dashboard-activity');
        if (c) c.innerHTML = '<h3>Upcoming Activities</h3><p style="color:var(--text-muted)">Could not load.</p>';
      });
    })();
    const shortcuts = document.getElementById('dashboard-shortcuts');
    if (shortcuts) {
      shortcuts.innerHTML = '<h3 style="margin:0 0 var(--space-sm)">Quick Actions</h3><div style="display:flex;gap:var(--space-md);flex-wrap:wrap">';
      shortcuts.innerHTML += '<a href="#leads/new" style="padding:var(--space-sm) var(--space-md);background:var(--color-primary);color:white;border-radius:var(--radius-sm);text-decoration:none">New Lead</a>';
      shortcuts.innerHTML += '<a href="#contacts/new" style="padding:var(--space-sm) var(--space-md);background:var(--color-primary);color:white;border-radius:var(--radius-sm);text-decoration:none">New Contact</a>';
      shortcuts.innerHTML += '</div>';
    }
    try {
      const recent = JSON.parse(sessionStorage.getItem('erp_recent_items') || '[]');
      const recentEl = document.getElementById('dashboard-recent');
      if (recentEl && recent.length) {
        recentEl.innerHTML = '<h3 style="margin:0 0 var(--space-sm)">Recent Items</h3><ul style="list-style:none;padding:0;margin:0">';
        recent.slice(0, 5).forEach(function (r) {
          const href = (r.route || '') + '/edit/' + (r.id || '');
          recentEl.innerHTML += '<li style="padding:var(--space-xs) 0"><a href="#' + href + '" style="text-decoration:none;color:inherit">' + (r.name || 'Item').replace(/</g, '&lt;') + '</a></li>';
        });
        recentEl.innerHTML += '</ul>';
      }
    } catch (e) {}
  }

  function renderSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }];
    main.innerHTML = '<h2>Settings</h2><p style="margin-bottom:var(--space-lg)">Manage your account and preferences.</p>';
    main.innerHTML += '<div style="display:flex;flex-direction:column;gap:var(--space-md);max-width:480px">';
    main.innerHTML += '<div class="settings-section" style="padding:var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><h3 style="margin:0 0 var(--space-sm)">General</h3><div id="settings-company"></div></div>';
    main.innerHTML += '<a href="#settings/users" style="display:block;padding:var(--space-md) var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm);text-decoration:none;color:inherit">Users</a>';
    main.innerHTML += '<div class="settings-section" style="padding:var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><h3 style="margin:0 0 var(--space-sm)">System Parameters</h3><div id="settings-params"></div></div>';
    main.innerHTML += '<div class="settings-section" style="padding:var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><h3 style="margin:0 0 var(--space-sm)">AI Configuration</h3><div id="settings-ai"></div></div>';
    main.innerHTML += '<div class="settings-section" style="padding:var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm)"><h3 style="margin:0 0 var(--space-sm)">Outgoing Mail Servers</h3><div id="settings-mail-servers"></div></div>';
    main.innerHTML += '<a href="#settings/dashboard-widgets" style="display:block;padding:var(--space-md) var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm);text-decoration:none;color:inherit">Dashboard Widgets</a>';
    main.innerHTML += '<a href="#settings/apikeys" style="display:block;padding:var(--space-md) var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm);text-decoration:none;color:inherit">API Keys</a>';
    main.innerHTML += '<a href="#settings/totp" style="display:block;padding:var(--space-md) var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm);text-decoration:none;color:inherit">Two-Factor Authentication</a>';
    main.innerHTML += '</div>';
    rpc.callKw('res.company', 'search_read', [[]], { fields: ['id', 'name'], limit: 1 })
      .then(function (rows) {
        const company = rows && rows[0];
        const container = document.getElementById('settings-company');
        if (!container) return;
        if (!company) {
          container.innerHTML = '<p style="color:var(--text-muted)">No company record.</p>';
          return;
        }
        container.innerHTML = '<label style="display:block;margin-bottom:var(--space-xs)">Company name</label>';
        container.innerHTML += '<input type="text" id="settings-company-name" value="' + (company.name || '').replace(/"/g, '&quot;') + '" style="padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);width:100%;max-width:280px">';
        container.innerHTML += '<button type="button" id="btn-save-company" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-lg);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer">Save</button>';
        const btn = document.getElementById('btn-save-company');
        const inp = document.getElementById('settings-company-name');
        if (btn && inp) {
          btn.onclick = function () {
            btn.disabled = true;
            rpc.callKw('res.company', 'write', [[company.id], { name: inp.value.trim() }], {})
              .then(function () { btn.disabled = false; showToast('Company saved', 'success'); })
              .catch(function (err) { btn.disabled = false; showToast(err.message || 'Failed to save', 'error'); });
          };
        }
      })
      .catch(function () {
        const c = document.getElementById('settings-company');
        if (c) c.innerHTML = '<p style="color:var(--text-muted)">Could not load company.</p>';
      });
    rpc.callKw('ir.config_parameter', 'search_read', [[]], { fields: ['id', 'key', 'value'], limit: 50 })
      .then(function (params) {
        const container = document.getElementById('settings-params');
        if (!container) return;
        if (!params || !params.length) {
          container.innerHTML = '<p style="color:var(--text-muted)">No parameters.</p>';
          return;
        }
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Key</th><th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Value</th></tr></thead><tbody>';
        params.forEach(function (p) {
          tbl += '<tr data-id="' + (p.id || '') + '"><td style="padding:var(--space-sm);border-bottom:1px solid #eee">' + (p.key || '').replace(/</g, '&lt;') + '</td>';
          tbl += '<td style="padding:var(--space-sm);border-bottom:1px solid #eee"><input type="text" class="param-value" data-key="' + (p.key || '').replace(/"/g, '&quot;') + '" value="' + (p.value || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></td></tr>';
        });
        tbl += '</tbody></table>';
        container.innerHTML = tbl;
        container.querySelectorAll('.param-value').forEach(function (inp) {
          inp.onblur = function () {
            const key = inp.getAttribute('data-key');
            if (!key) return;
            rpc.callKw('ir.config_parameter', 'set_param', [key, inp.value], {})
              .then(function () { showToast('Parameter saved', 'success'); })
              .catch(function (err) { showToast(err.message || 'Failed to save', 'error'); });
          };
        });
      })
      .catch(function () {
        const c = document.getElementById('settings-params');
        if (c) c.innerHTML = '<p style="color:var(--text-muted)">Could not load parameters.</p>';
      });
    rpc.callKw('ir.config_parameter', 'search_read', [[['key', 'in', ['ai.openai_api_key', 'ai.llm_enabled', 'ai.llm_model']]]], { fields: ['key', 'value'] })
      .then(function (params) {
        const container = document.getElementById('settings-ai');
        if (!container) return;
        const byKey = {};
        (params || []).forEach(function (p) { byKey[p.key] = (p.value || '').trim(); });
        const apiKey = byKey['ai.openai_api_key'] || '';
        const llmEnabled = (byKey['ai.llm_enabled'] || '0') === '1';
        const llmModel = byKey['ai.llm_model'] || 'gpt-4o-mini';
        let html = '<label style="display:block;margin-bottom:var(--space-xs)">OpenAI API Key</label>';
        html += '<input type="password" id="ai-api-key" placeholder="sk-..." value="' + apiKey.replace(/"/g, '&quot;') + '" style="padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);width:100%;max-width:320px;margin-bottom:var(--space-md)">';
        html += '<label style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-md);cursor:pointer">';
        html += '<input type="checkbox" id="ai-llm-enabled" ' + (llmEnabled ? 'checked' : '') + '> Enable LLM (conversational AI)';
        html += '</label>';
        html += '<label style="display:block;margin-bottom:var(--space-xs)">Model</label>';
        html += '<select id="ai-llm-model" style="padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-bottom:var(--space-md)">';
        html += '<option value="gpt-4o-mini"' + (llmModel === 'gpt-4o-mini' ? ' selected' : '') + '>gpt-4o-mini</option>';
        html += '<option value="gpt-4o"' + (llmModel === 'gpt-4o' ? ' selected' : '') + '>gpt-4o</option>';
        html += '<option value="gpt-4-turbo"' + (llmModel === 'gpt-4-turbo' ? ' selected' : '') + '>gpt-4-turbo</option>';
        html += '</select>';
        html += '<button type="button" id="btn-save-ai" style="padding:var(--space-sm) var(--space-lg);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer">Save</button>';
        container.innerHTML = html;
        const btn = document.getElementById('btn-save-ai');
        if (btn) {
          btn.onclick = function () {
            const keyInp = document.getElementById('ai-api-key');
            const enabledInp = document.getElementById('ai-llm-enabled');
            const modelInp = document.getElementById('ai-llm-model');
            if (!keyInp || !enabledInp || !modelInp) return;
            btn.disabled = true;
            Promise.all([
              rpc.callKw('ir.config_parameter', 'set_param', ['ai.openai_api_key', keyInp.value], {}),
              rpc.callKw('ir.config_parameter', 'set_param', ['ai.llm_enabled', enabledInp.checked ? '1' : '0'], {}),
              rpc.callKw('ir.config_parameter', 'set_param', ['ai.llm_model', modelInp.value], {})
            ]).then(function () { btn.disabled = false; showToast('AI configuration saved', 'success'); })
              .catch(function (err) { btn.disabled = false; showToast(err.message || 'Failed to save', 'error'); });
          };
        }
      })
      .catch(function () {
        const c = document.getElementById('settings-ai');
        if (c) c.innerHTML = '<p style="color:var(--text-muted)">Could not load AI configuration.</p>';
      });
    rpc.callKw('ir.mail_server', 'search_read', [[]], { fields: ['id', 'name', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_encryption'], order: 'sequence' })
      .then(function (servers) {
        const container = document.getElementById('settings-mail-servers');
        if (!container) return;
        let html = '<div style="display:flex;flex-direction:column;gap:var(--space-md)">';
        (servers || []).forEach(function (s) {
          html += '<div class="mail-server-row" data-id="' + (s.id || '') + '" style="padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-card)">';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);margin-bottom:var(--space-sm)">';
          html += '<div><label style="font-size:0.85rem;color:var(--text-muted)">Host</label><input type="text" class="mail-host" value="' + (s.smtp_host || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></div>';
          html += '<div><label style="font-size:0.85rem;color:var(--text-muted)">Port</label><input type="number" class="mail-port" value="' + (s.smtp_port || 25) + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></div>';
          html += '<div><label style="font-size:0.85rem;color:var(--text-muted)">User</label><input type="text" class="mail-user" value="' + (s.smtp_user || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></div>';
          html += '<div><label style="font-size:0.85rem;color:var(--text-muted)">Encryption</label><select class="mail-enc" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"><option value="none"' + ((s.smtp_encryption || 'none') === 'none' ? ' selected' : '') + '>None</option><option value="starttls"' + ((s.smtp_encryption || '') === 'starttls' ? ' selected' : '') + '>TLS (STARTTLS)</option><option value="ssl"' + ((s.smtp_encryption || '') === 'ssl' ? ' selected' : '') + '>SSL/TLS</option></select></div>';
          html += '</div>';
          html += '<div style="display:flex;gap:var(--space-sm)">';
          html += '<button type="button" class="btn-mail-save" style="padding:0.25rem 0.75rem;background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.9rem">Save</button>';
          html += '<button type="button" class="btn-mail-test" style="padding:0.25rem 0.75rem;background:var(--bg-card);color:var(--text);border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;font-size:0.9rem">Test Connection</button>';
          html += '</div></div>';
        });
        html += '<button type="button" id="btn-add-mail-server" style="padding:var(--space-sm) var(--space-md);background:var(--bg-card);border:1px dashed var(--border-color);border-radius:var(--radius-sm);cursor:pointer;color:var(--text-muted)">+ Add Mail Server</button>';
        html += '</div>';
        container.innerHTML = html;
        container.querySelectorAll('.mail-server-row').forEach(function (row) {
          const id = parseInt(row.getAttribute('data-id'), 10);
          const saveBtn = row.querySelector('.btn-mail-save');
          const testBtn = row.querySelector('.btn-mail-test');
          if (saveBtn) {
            saveBtn.onclick = function () {
              const host = row.querySelector('.mail-host').value.trim();
              const port = parseInt(row.querySelector('.mail-port').value, 10) || 25;
              const user = row.querySelector('.mail-user').value.trim();
              const enc = row.querySelector('.mail-enc').value;
              rpc.callKw('ir.mail_server', 'write', [[id], { smtp_host: host, smtp_port: port, smtp_user: user || false, smtp_encryption: enc }], {})
                .then(function () { showToast('Mail server saved', 'success'); })
                .catch(function (err) { showToast(err.message || 'Failed', 'error'); });
            };
          }
          if (testBtn) {
            testBtn.onclick = function () {
              testBtn.disabled = true;
              rpc.callKw('ir.mail_server', 'test_smtp_connection', [[id]], {})
                .then(function (res) {
                  testBtn.disabled = false;
                  showToast(res.success ? res.message : res.message, res.success ? 'success' : 'error');
                })
                .catch(function (err) { testBtn.disabled = false; showToast(err.message || 'Test failed', 'error'); });
            };
          }
        });
        const addBtn = document.getElementById('btn-add-mail-server');
        if (addBtn) {
          addBtn.onclick = function () {
            rpc.callKw('ir.mail_server', 'create', [{ name: 'New SMTP Server', smtp_host: 'smtp.example.com', smtp_port: 587 }], {})
              .then(function () { renderSettings(); })
              .catch(function (err) { showToast(err.message || 'Failed to create', 'error'); });
          };
        }
      })
      .catch(function () {
        const c = document.getElementById('settings-mail-servers');
        if (c) c.innerHTML = '<p style="color:var(--text-muted)">Could not load mail servers.</p>';
      });
  }

  function renderDashboardWidgets() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'Dashboard Widgets', hash: 'settings/dashboard-widgets' }];
    main.innerHTML = renderBreadcrumbs() + '<h2>Dashboard Widgets</h2><p>Loading...</p>';
    rpc.callKw('ir.dashboard.widget', 'search_read', [[]], { fields: ['id', 'name', 'model', 'domain', 'measure_field', 'aggregate', 'sequence'], order: 'sequence' })
      .then(function (widgets) {
        let html = '<h2>Dashboard Widgets</h2><p style="margin-bottom:var(--space-lg)">Configure KPI cards shown on the home dashboard.</p>';
        html += '<table style="width:100%;border-collapse:collapse;max-width:720px"><thead><tr>';
        html += '<th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Name</th>';
        html += '<th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Model</th>';
        html += '<th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Domain</th>';
        html += '<th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Sequence</th>';
        html += '<th style="text-align:left;padding:var(--space-sm);border-bottom:1px solid var(--border-color)">Actions</th></tr></thead><tbody>';
        (widgets || []).forEach(function (w) {
          html += '<tr data-id="' + (w.id || '') + '">';
          html += '<td style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><input type="text" class="widget-name" value="' + (w.name || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></td>';
          html += '<td style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><input type="text" class="widget-model" value="' + (w.model || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)" placeholder="crm.lead"></td>';
          html += '<td style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><input type="text" class="widget-domain" value="' + (w.domain || '').replace(/"/g, '&quot;') + '" style="width:100%;min-width:120px;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)" placeholder="[]"></td>';
          html += '<td style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><input type="number" class="widget-sequence" value="' + (w.sequence || 10) + '" style="width:60px;padding:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm)"></td>';
          html += '<td style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)"><button type="button" class="btn-widget-save" style="padding:0.25rem 0.5rem;font-size:0.85rem;background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;margin-right:0.25rem">Save</button><button type="button" class="btn-widget-delete" style="padding:0.25rem 0.5rem;font-size:0.85rem;background:transparent;color:#c00;border:1px solid #c00;border-radius:var(--radius-sm);cursor:pointer">Delete</button></td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
        html += '<button type="button" id="btn-add-widget" style="margin-top:var(--space-lg);padding:var(--space-sm) var(--space-md);background:var(--bg-card);border:1px dashed var(--border-color);border-radius:var(--radius-sm);cursor:pointer;color:var(--text-muted)">+ Add Widget</button>';
        main.innerHTML = html;
        main.querySelectorAll('.btn-widget-save').forEach(function (btn) {
          const row = btn.closest('tr');
          if (!row) return;
          const id = parseInt(row.getAttribute('data-id'), 10);
          btn.onclick = function () {
            const name = row.querySelector('.widget-name').value.trim();
            const model = row.querySelector('.widget-model').value.trim();
            const domain = row.querySelector('.widget-domain').value.trim();
            const seq = parseInt(row.querySelector('.widget-sequence').value, 10) || 10;
            btn.disabled = true;
            rpc.callKw('ir.dashboard.widget', 'write', [[id], { name: name || 'Widget', model: model || 'crm.lead', domain: domain || '[]', sequence: seq }], {})
              .then(function () { btn.disabled = false; showToast('Widget saved', 'success'); })
              .catch(function (err) { btn.disabled = false; showToast(err.message || 'Failed', 'error'); });
          };
        });
        main.querySelectorAll('.btn-widget-delete').forEach(function (btn) {
          const row = btn.closest('tr');
          if (!row) return;
          const id = parseInt(row.getAttribute('data-id'), 10);
          btn.onclick = function () {
            if (!confirm('Delete this widget?')) return;
            rpc.callKw('ir.dashboard.widget', 'unlink', [[id]], {})
              .then(function () { renderDashboardWidgets(); showToast('Widget deleted', 'success'); })
              .catch(function (err) { showToast(err.message || 'Failed', 'error'); });
          };
        });
        const addBtn = document.getElementById('btn-add-widget');
        if (addBtn) {
          addBtn.onclick = function () {
            rpc.callKw('ir.dashboard.widget', 'create', [{ name: 'New Widget', model: 'crm.lead', domain: '[]', sequence: 99 }], {})
              .then(function () { renderDashboardWidgets(); showToast('Widget created', 'success'); })
              .catch(function (err) { showToast(err.message || 'Failed to create', 'error'); });
          };
        }
      })
      .catch(function (err) {
        const msg = (err && err.message) ? String(err.message) : 'Unknown error';
        const dbHint = 'erp';
        main.innerHTML = '<h2>Dashboard Widgets</h2><p class="error" style="color:#c00">Could not load widgets: ' + msg.replace(/</g, '&lt;') + '</p><p style="margin-top:var(--space-md);font-size:0.9rem;color:#666">If the table does not exist, run: <code>./erp-bin db init -d ' + dbHint + '</code></p><button type="button" id="btn-retry-widgets" style="margin-top:var(--space-md);padding:0.5rem 1rem;background:var(--color-primary,#1a1a2e);color:white;border:none;border-radius:4px;cursor:pointer">Retry</button>';
        const retryBtn = document.getElementById('btn-retry-widgets');
        if (retryBtn) retryBtn.onclick = function () { renderDashboardWidgets(); };
      });
  }

  function renderApiKeysSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'API Keys', hash: 'settings/apikeys' }];
    main.innerHTML = renderBreadcrumbs() + '<h2>API Keys</h2><p>Loading...</p>';
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
                  if (typeof navigator.clipboard !== 'undefined' && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(rawKey).then(function () {
                      showToast('API key generated and copied to clipboard.', 'success');
                    }).catch(function () { showToast('API key generated. Copy it now - it will not be shown again.', 'warning'); });
                  } else {
                    showToast('API key generated. Copy it now - it will not be shown again.', 'warning');
                  }
                  renderApiKeysSettings();
                })
                .catch(function (err) {
                  btn.disabled = false;
                  showToast(err.message || 'Failed to generate key', 'error');
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
                .catch(function (err) { showToast(err.message || 'Failed to revoke', 'error'); });
            };
          });
        })
        .catch(function (err) {
          main.innerHTML = '<h2>API Keys</h2><p class="error">' + (err.message || 'Failed to load keys') + '</p>';
        });
    });
  }

  function renderTotpSettings() {
    actionStack = [{ label: 'Settings', hash: 'settings' }, { label: 'Two-Factor Authentication', hash: 'settings/totp' }];
    main.innerHTML = renderBreadcrumbs() + '<h2>Two-Factor Authentication</h2><p>Loading...</p>';
    fetch('/web/totp/status', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const enabled = data && data.enabled;
        let html = '<h2>Two-Factor Authentication</h2><p style="margin-bottom:var(--space-lg)">Add an extra layer of security with TOTP (authenticator app).</p>';
        html += '<div class="settings-section" style="padding:var(--space-lg);border:1px solid var(--border-color);border-radius:var(--radius-sm);max-width:400px">';
        if (enabled) {
          html += '<p style="color:var(--color-success,#080);margin-bottom:var(--space-md)">2FA is enabled.</p>';
          html += '<button type="button" id="btn-totp-disable" style="padding:var(--space-sm) var(--space-lg);background:#c00;color:white;border:none;border-radius:var(--radius-sm);cursor:pointer">Disable 2FA</button>';
        } else {
          html += '<p style="margin-bottom:var(--space-md)">2FA is not enabled.</p>';
          html += '<button type="button" id="btn-totp-begin" style="padding:var(--space-sm) var(--space-lg);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer">Enable 2FA</button>';
          html += '<div id="totp-setup-area" style="display:none;margin-top:var(--space-lg)">';
          html += '<p>Scan the QR code with your authenticator app.</p>';
          html += '<div id="totp-qr"></div>';
          html += '<p style="margin-top:var(--space-md)">Or enter this secret manually: <code id="totp-secret"></code></p>';
          html += '<label style="display:block;margin-top:var(--space-md)">Enter the 6-digit code to confirm:</label>';
          html += '<input type="text" id="totp-code" placeholder="000000" maxlength="6" pattern="[0-9]{6}" style="padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);width:100px;margin-top:var(--space-xs)">';
          html += '<button type="button" id="btn-totp-confirm" style="display:block;margin-top:var(--space-sm);padding:var(--space-sm) var(--space-lg);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer">Confirm</button>';
          html += '</div>';
        }
        html += '</div>';
        main.innerHTML = renderBreadcrumbs() + html;
        const btnBegin = document.getElementById('btn-totp-begin');
        const btnDisable = document.getElementById('btn-totp-disable');
        const btnConfirm = document.getElementById('btn-totp-confirm');
        if (btnBegin) {
          btnBegin.onclick = function () {
            btnBegin.disabled = true;
            fetch('/web/totp/begin_setup', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
              .then(function (r) { return r.json(); })
              .then(function (d) {
                btnBegin.disabled = false;
                if (d.error) { showToast(d.error, 'error'); return; }
                document.getElementById('totp-setup-area').style.display = 'block';
                document.getElementById('totp-secret').textContent = d.secret || '';
                const qrDiv = document.getElementById('totp-qr');
                if (d.provision_uri && typeof QRCode !== 'undefined') {
                  qrDiv.innerHTML = '';
                  new QRCode(qrDiv, { text: d.provision_uri, width: 180, height: 180 });
                } else if (d.provision_uri) {
                  qrDiv.innerHTML = '<a href="' + d.provision_uri.replace(/"/g, '&quot;') + '" target="_blank">Open in authenticator</a>';
                }
              })
              .catch(function (err) { btnBegin.disabled = false; showToast(err.message || 'Failed', 'error'); });
          };
        }
        if (btnConfirm) {
          btnConfirm.onclick = function () {
            const code = (document.getElementById('totp-code').value || '').trim();
            if (!code || code.length !== 6) { showToast('Enter 6-digit code', 'error'); return; }
            btnConfirm.disabled = true;
            fetch('/web/totp/confirm_setup', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) })
              .then(function (r) { return r.json(); })
              .then(function (d) {
                btnConfirm.disabled = false;
                if (d.error) { showToast(d.error, 'error'); return; }
                showToast('2FA enabled', 'success');
                renderTotpSettings();
              })
              .catch(function (err) { btnConfirm.disabled = false; showToast(err.message || 'Failed', 'error'); });
          };
        }
        if (btnDisable) {
          btnDisable.onclick = function () {
            if (!confirm('Disable two-factor authentication? Your account will be less secure.')) return;
            fetch('/web/totp/disable', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
              .then(function (r) { return r.json(); })
              .then(function (d) {
                if (d.error) { showToast(d.error, 'error'); return; }
                showToast('2FA disabled', 'success');
                renderTotpSettings();
              })
              .catch(function (err) { showToast(err.message || 'Failed', 'error'); });
          };
        }
      })
      .catch(function () {
        main.innerHTML = renderBreadcrumbs() + '<h2>Two-Factor Authentication</h2><p class="error">Failed to load status.</p>';
      });
  }

  function getDisplayNames(model, colName, records) {
    if (records && records.length && records[0][colName + '_display'] !== undefined) {
      var map = {};
      records.forEach(function (r) {
        var v = r[colName];
        if (v && !map[v]) map[v] = r[colName + '_display'] || v;
      });
      return Promise.resolve(map);
    }
    const comodel = getMany2oneComodel(model, colName);
    if (!comodel) return Promise.resolve({});
    const ids = [];
    records.forEach(function (r) { const v = r[colName]; if (v) ids.push(v); });
    if (!ids.length) return Promise.resolve({});
    const uniq = ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var map = {};
    return rpc.callKw(comodel, 'read', [uniq, ['id', 'name', 'display_name']])
      .then(function (rows) {
        (rows || []).forEach(function (row) { map[row.id] = row.display_name || row.name || row.id; });
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
    const modes = getAvailableViewModes(route).filter(function (m) { return m === 'list' || m === 'kanban' || m === 'graph' || m === 'calendar'; });
    if (modes.length < 2) return '';
    const labels = { list: 'List', kanban: 'Kanban', graph: 'Graph', pivot: 'Pivot', calendar: 'Calendar' };
    let html = '<span class="view-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
    modes.forEach(function (m) {
      const active = m === currentView;
      html += '<button type="button" class="btn-view' + (active ? ' active' : '') + '" data-view="' + m + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (labels[m] || m) + '</button>';
    });
    return html + '</span>';
  }

  function renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    if (typeof window !== 'undefined') window.chatContext = { model: model, active_id: null };
    const cols = getListColumns(model);
    const title = getTitle(route);
    const addLabel = route === 'contacts' ? 'Add contact' : route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = (currentListState.route === route && currentListState.viewType) || 'list';
    const order = (currentListState.route === route && currentListState.order) || null;
    actionStack = [{ label: title, hash: route }];
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += renderViewSwitcher(route, currentView);
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    html += '<button type="button" id="btn-ai-search" title="Natural language search" style="padding:0.5rem 1rem;background:var(--color-accent, #6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Search</button>';
    const searchView = viewsSvc && viewsSvc.getView(model, 'search');
    const searchFilters = (searchView && searchView.filters) || [];
    const searchGroupBys = (searchView && searchView.group_bys) || [];
    const activeFilters = currentListState.activeSearchFilters || [];
    const currentGroupBy = currentListState.groupBy || null;
    searchFilters.forEach(function (f) {
      const active = activeFilters.indexOf(f.name) >= 0;
      html += '<button type="button" class="btn-search-filter' + (active ? ' active' : '') + '" data-filter="' + (f.name || '').replace(/"/g, '&quot;') + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (f.string || f.name || '').replace(/</g, '&lt;') + '</button>';
    });
    if (searchGroupBys.length) {
      html += '<select id="list-group-by" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">Group by</option>';
      searchGroupBys.forEach(function (g) {
        html += '<option value="' + (g.group_by || '').replace(/"/g, '&quot;') + '"' + (currentGroupBy === g.group_by ? ' selected' : '') + '>' + (g.string || g.name || '').replace(/</g, '&lt;') + '</option>';
      });
      html += '</select>';
    }
    html += '<select id="list-saved-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function (f) {
      html += '<option value="' + (f.id != null ? String(f.id) : '').replace(/"/g, '&quot;') + '"' + (currentListState.savedFilterId == f.id ? ' selected' : '') + '>' + (f.name || 'Filter').replace(/</g, '&lt;') + '</option>';
    });
    html += '</select>';
    html += '<button type="button" id="btn-save-filter" style="padding:0.5rem 0.75rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Save</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-export" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Export</button>';
    html += '<button type="button" id="btn-import" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Import</button>';
    const reportName = getReportName(model);
    if (reportName) html += '<button type="button" id="btn-print" style="padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Print</button>';
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + addLabel + '</button></p>';
    const hasFacets = (activeFilters.length > 0 || currentGroupBy);
    if (hasFacets) {
      html += '<p class="facet-chips" style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:var(--space-sm);align-items:center">';
      activeFilters.forEach(function (fname) {
        const f = searchFilters.find(function (x) { return x.name === fname; });
        html += '<span class="facet-chip" data-type="filter" data-name="' + (fname || '').replace(/"/g, '&quot;') + '" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--color-primary, #1a1a2e);color:white;border-radius:4px;font-size:0.85rem">' + (f ? (f.string || fname) : fname).replace(/</g, '&lt;') + ' <button type="button" class="facet-remove" aria-label="Remove" style="background:none;border:none;color:white;cursor:pointer;padding:0;font-size:1rem;line-height:1">&times;</button></span>';
      });
      if (currentGroupBy) {
        const g = searchGroupBys.find(function (x) { return x.group_by === currentGroupBy; });
        html += '<span class="facet-chip" data-type="groupby" data-name="' + (currentGroupBy || '').replace(/"/g, '&quot;') + '" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--color-primary, #1a1a2e);color:white;border-radius:4px;font-size:0.85rem">Group: ' + (g ? (g.string || currentGroupBy) : currentGroupBy).replace(/</g, '&lt;') + ' <button type="button" class="facet-remove" aria-label="Remove" style="background:none;border:none;color:white;cursor:pointer;padding:0;font-size:1rem;line-height:1">&times;</button></span>';
      }
      html += '</p>';
    }
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
      const numericCols = ['expected_revenue', 'revenue', 'amount', 'quantity'];
      function renderTable(nameMap) {
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(c => {
          const f = typeof c === 'object' ? c.name : c;
          const label = (typeof c === 'object' ? c.name || c : c);
          const isSorted = order && (order.startsWith(f + ' ') || order.startsWith(f + ','));
          const dir = isSorted && order.indexOf('desc') >= 0 ? 'desc' : 'asc';
          const arrow = isSorted ? (dir === 'asc' ? ' \u25b2' : ' \u25bc') : '';
          tbl += '<th class="sortable-col" data-field="' + (f || '').replace(/"/g, '&quot;') + '" style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd;cursor:pointer;user-select:none">' + (label || '').replace(/</g, '&lt;') + arrow + '</th>';
        });
        tbl += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd"></th></tr></thead><tbody>';
        const groupByField = currentListState.groupBy;
        const groups = groupByField ? (function () {
          const g = {};
          (records || []).forEach(function (r) {
            const k = r[groupByField] != null ? r[groupByField] : '__false__';
            if (!g[k]) g[k] = [];
            g[k].push(r);
          });
          return Object.keys(g).map(function (k) { return { key: k === '__false__' ? false : k, rows: g[k] }; });
        })() : null;
        function renderRow(r, isGroupHeader, isSubtotal) {
          if (isGroupHeader) {
            const gval = r;
            const label = (nameMap && nameMap[groupByField] && gval != null) ? (nameMap[groupByField][gval] || gval) : (gval != null ? String(gval) : '(No value)');
            tbl += '<tr class="group-header" style="background:var(--color-bg-secondary, #f0f0f0);font-weight:600"><td colspan="' + (cols.length + 1) + '" style="padding:0.5rem;border-bottom:1px solid #ddd">' + String(label).replace(/</g, '&lt;') + '</td></tr>';
            return;
          }
          if (isSubtotal) {
            tbl += '<tr class="group-subtotal" style="background:var(--color-bg-secondary, #f8f8f8);font-weight:500">';
            cols.forEach(c => {
              const f = typeof c === 'object' ? c.name : c;
              const sum = r[f];
              const isNum = numericCols.indexOf(f) >= 0;
              tbl += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (isNum && sum != null ? Number(sum).toLocaleString() : '').replace(/</g, '&lt;') + '</td>';
            });
            tbl += '<td style="padding:0.5rem;border-bottom:1px solid #eee"></td></tr>';
            return;
          }
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
              else if (isMonetaryField(model, f)) {
                const n = Number(val);
                let formatted = !isNaN(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val;
                const currField = getMonetaryCurrencyField(model, f);
                if (currField && r[currField] && nameMap && nameMap[currField]) {
                  const sym = nameMap[currField][r[currField]];
                  if (sym) formatted = (sym + ' ' + formatted).trim();
                }
                val = formatted;
              } else {
                const selLabel = getSelectionLabel(model, f, val);
                if (selLabel !== val) val = selLabel;
              }
            }
            tbl += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + (val != null ? String(val) : '').replace(/</g, '&lt;') + '</td>';
          });
          tbl += '<td style="padding:0.5rem"><a href="#' + route + '/edit/' + (r.id || '') + '" style="font-size:0.9rem;margin-right:0.5rem">Edit</a>';
          tbl += '<a href="#" class="btn-delete" data-id="' + (r.id || '') + '" style="font-size:0.9rem;color:#c00">Delete</a></td></tr>';
        }
        if (groups) {
          groups.forEach(function (grp) {
            renderRow(grp.key, true);
            grp.rows.forEach(function (r) { renderRow(r, false); });
            const subtotal = {};
            numericCols.forEach(function (f) {
              if (cols.some(function (c) { return (typeof c === 'object' ? c.name : c) === f; })) {
                subtotal[f] = grp.rows.reduce(function (s, r) { return s + (Number(r[f]) || 0); }, 0);
              }
            });
            if (Object.keys(subtotal).length) renderRow(subtotal, false, true);
          });
        } else {
          records.forEach(r => { renderRow(r, false); });
        }
        tbl += '</tbody></table>';
        const total = totalCount != null ? totalCount : (records ? records.length : 0);
        const off = offset != null ? offset : 0;
        const lim = limit != null ? limit : 80;
        let pager = '';
        if (total > 0 && records && records.length) {
          const from = off + 1;
          const to = Math.min(off + lim, total);
          pager = '<p class="list-pager" style="margin-top:0.5rem;font-size:0.9rem;color:#666">';
          pager += from + '-' + to + ' of ' + total + ' ';
          pager += '<button type="button" class="btn-pager-prev" ' + (off <= 0 ? 'disabled' : '') + ' style="margin-left:0.5rem;padding:0.25rem 0.5rem;cursor:' + (off <= 0 ? 'not-allowed' : 'pointer') + '">Prev</button>';
          pager += ' <button type="button" class="btn-pager-next" ' + (off + lim >= total ? 'disabled' : '') + ' style="margin-left:0.25rem;padding:0.25rem 0.5rem;cursor:' + (off + lim >= total ? 'not-allowed' : 'pointer') + '">Next</button>';
          pager += '</p>';
        }
        main.innerHTML = html + tbl + pager;
      }
      const monetaryCurrCols = cols.filter(function (c) {
        const f = typeof c === 'object' ? c.name : c;
        return isMonetaryField(model, f) && getMonetaryCurrencyField(model, f);
      }).map(function (c) { return getMonetaryCurrencyField(model, typeof c === 'object' ? c.name : c); }).filter(Boolean);
      const currCols = monetaryCurrCols.filter(function (f, i, a) { return a.indexOf(f) === i; });
      const allCols = m2oCols.length || m2mCols.length || currCols.length;
      if (allCols) {
        const promises = m2oCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
        }).concat(m2mCols.map(function (c) {
          const f = typeof c === 'object' ? c.name : c;
          return getDisplayNamesForMany2many(model, f, records).then(function (m) { return { f: f, m: m }; });
        })).concat(currCols.map(function (f) {
          return getDisplayNames(model, f, records).then(function (m) { return { f: f, m: m }; });
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
    const btnExport = document.getElementById('btn-export');
    if (btnExport && records && records.length) {
      btnExport.onclick = function () {
        const tbl = main.querySelector('table');
        if (!tbl) return;
        const rows = tbl.querySelectorAll('tr');
        const lines = [];
        rows.forEach(function (tr) {
          const cells = tr.querySelectorAll('td, th');
          const vals = [];
          cells.forEach(function (cell) {
            const txt = (cell.textContent || '').trim().replace(/"/g, '""');
            vals.push(txt.indexOf(',') >= 0 || txt.indexOf('"') >= 0 || txt.indexOf('\n') >= 0 ? '"' + txt + '"' : txt);
          });
          if (vals.length) lines.push(vals.join(','));
        });
        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (route || 'export') + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
    }
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
      btnImport.onclick = function () { showImportModal(model, route); };
    }
    const btnPrint = document.getElementById('btn-print');
    if (btnPrint && reportName && records && records.length) {
      btnPrint.onclick = function () {
        const ids = records.map(function (r) { return r.id; }).filter(function (x) { return x; });
        if (ids.length) window.open('/report/html/' + reportName + '/' + ids.join(','), '_blank', 'noopener');
      };
    }
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const sf = document.getElementById('list-saved-filter');
        const stageEl = document.getElementById('list-stage-filter');
        const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), stageVal, null, sf && sf.value ? sf.value : null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
    const btnAiSearch = document.getElementById('btn-ai-search');
    if (btnAiSearch && searchInput) {
      btnAiSearch.onclick = function () {
        const query = searchInput.value.trim();
        if (!query) {
          const sf = document.getElementById('list-saved-filter');
          const stageEl = document.getElementById('list-stage-filter');
          const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
          loadRecords(model, route, '', stageVal, null, sf && sf.value ? sf.value : null, 0, null);
          return;
        }
        btnAiSearch.disabled = true;
        btnAiSearch.textContent = '...';
        fetch('/ai/nl_search', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, query: query, limit: 80 })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error || 'AI search failed', 'error'); return; }
            const action = getActionForRoute(route);
            const actionDomain = action ? parseActionDomain(action.domain || '') : [];
            const nlDomain = (data.domain && data.domain.length) ? data.domain : [];
            const domainOverride = actionDomain.concat(nlDomain);
            const sf = document.getElementById('list-saved-filter');
            const stageEl = document.getElementById('list-stage-filter');
            const stageVal = stageEl && stageEl.value ? parseInt(stageEl.value, 10) : null;
            loadRecords(model, route, query, stageVal, null, sf && sf.value ? sf.value : null, 0, null, domainOverride.length ? domainOverride : undefined);
          })
          .catch(function (err) { showToast(err.message || 'AI search failed', 'error'); })
          .finally(function () { btnAiSearch.disabled = false; btnAiSearch.textContent = 'AI Search'; });
      };
    }
    main.querySelectorAll('.btn-delete').forEach(a => {
      a.onclick = (e) => { e.preventDefault(); if (confirm('Delete this record?')) deleteRecord(model, route, a.dataset.id); };
    });
    main.querySelectorAll('.btn-view').forEach(btn => {
      btn.onclick = () => { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    main.querySelectorAll('.btn-search-filter').forEach(btn => {
      btn.onclick = function () {
        const fname = btn.dataset.filter;
        if (!fname) return;
        const cur = currentListState.activeSearchFilters || [];
        const idx = cur.indexOf(fname);
        const next = idx >= 0 ? cur.filter(function (_, i) { return i !== idx; }) : cur.concat(fname);
        currentListState.activeSearchFilters = next;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    const groupByEl = document.getElementById('list-group-by');
    if (groupByEl) {
      groupByEl.onchange = function () {
        currentListState.groupBy = groupByEl.value || null;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    }
    main.querySelectorAll('.facet-chip .facet-remove').forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        const chip = btn.closest('.facet-chip');
        if (!chip) return;
        const typ = chip.dataset.type;
        const name = chip.dataset.name;
        if (typ === 'filter') {
          currentListState.activeSearchFilters = (currentListState.activeSearchFilters || []).filter(function (f) { return f !== name; });
        } else if (typ === 'groupby') {
          currentListState.groupBy = null;
        }
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, currentListState.savedFilterId, 0, null);
      };
    });
    main.querySelectorAll('.sortable-col').forEach(th => {
      th.onclick = function () {
        const f = th.dataset.field;
        if (!f) return;
        const cur = (currentListState.route === route && currentListState.order) || '';
        const nextDir = (cur.startsWith(f + ' ') && cur.indexOf('desc') < 0) ? 'desc' : 'asc';
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, 0, f + ' ' + nextDir);
      };
    });
    main.querySelectorAll('.btn-pager-prev').forEach(btn => {
      btn.onclick = function () {
        if (btn.disabled) return;
        const off = (currentListState.offset || 0) - (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, Math.max(0, off), null);
      };
    });
    main.querySelectorAll('.btn-pager-next').forEach(btn => {
      btn.onclick = function () {
        if (btn.disabled) return;
        const off = (currentListState.offset || 0) + (currentListState.limit || 80);
        loadRecords(model, route, searchTerm, stageFilter, null, currentListState.savedFilterId, off, null);
      };
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
              loadRecords(model, route, document.getElementById('list-search').value.trim(), val, null, null, 0, null);
            };
          });
      }
    }
    const savedFilterEl = document.getElementById('list-saved-filter');
    if (savedFilterEl) {
      savedFilterEl.onchange = function () {
        const fid = savedFilterEl.value || null;
        const si = document.getElementById('list-search');
        loadRecords(model, route, si ? si.value.trim() : '', stageFilter, null, fid, 0, null);
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
        saveSavedFilter(model, name.trim(), domain).then(function () {
          loadRecords(model, route, st, stageFilter, null, null, 0, null);
        });
      };
    }
  }

  let currentListState = { model: null, route: null, searchTerm: '', stageFilter: null, viewType: null, savedFilterId: null, offset: 0, limit: 80, order: null, totalCount: 0, activeSearchFilters: [], groupBy: null };

  function deleteRecord(model, route, id) {
    rpc.callKw(model, 'unlink', [[parseInt(id, 10)]])
      .then(() => { showToast('Record deleted', 'success'); loadRecords(model, route, currentListState.searchTerm); })
      .catch(err => { showToast(err.message || 'Failed to delete', 'error'); });
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

  function getFieldMeta(model, fname) {
    return viewsSvc ? viewsSvc.getFieldMeta(model, fname) : null;
  }

  function getMany2oneComodel(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) return def.comodel;
    const meta = getFieldMeta(model, fname);
    if (meta && meta.comodel) return meta.comodel;
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
    const meta = getFieldMeta(model, fname);
    if (meta && meta.selection && meta.selection.length) return meta.selection;
    return null;
  }

  function isBooleanField(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'boolean';
    return false;
  }

  function isMonetaryField(model, fname) {
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'monetary';
  }

  function getMonetaryCurrencyField(model, fname) {
    const meta = getFieldMeta(model, fname);
    return (meta && meta.type === 'monetary' && meta.currency_field) ? meta.currency_field : null;
  }

  function isBinaryField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'binary') return true;
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'binary') return true;
    return false;
  }

  function isHtmlField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'html') return true;
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'html';
  }

  function isImageField(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.widget === 'image') return true;
    const meta = getFieldMeta(model, fname);
    return meta && meta.type === 'image';
  }

  function getSelectionLabel(model, fname, value) {
    const opts = getSelectionOptions(model, fname);
    if (!opts || value == null || value === '') return value;
    const pair = opts.find(function (o) { return o[0] === value || String(o[0]) === String(value); });
    return pair ? pair[1] : value;
  }

  function getOne2manyInfo(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'one2many' && meta.comodel) return { comodel: meta.comodel, inverse: meta.inverse_name || '' };
    return null;
  }

  function renderOne2manyRow(fname, lineFields, rowData, rowIndex) {
    var id = rowData && rowData.id;
    var dataAttrs = id ? ' data-o2m-id="' + id + '"' : ' data-o2m-new="1"';
    var cells = lineFields.map(function (lf) {
      var val = (rowData && rowData[lf]) || '';
      return '<td style="padding:0.25rem"><input type="' + (lf === 'date_deadline' ? 'date' : 'text') + '" data-o2m-field="' + lf + '" value="' + (val || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:0.25rem;font-size:0.9rem"></td>';
    }).join('');
    return '<tr' + dataAttrs + '>' + cells + '<td style="padding:0.25rem"><button type="button" class="o2m-delete-row" style="padding:0.2rem 0.4rem;font-size:0.8rem;cursor:pointer;color:#c00">Delete</button></td></tr>';
  }

  function setupOne2manyAddButtons(form, model) {
    form.querySelectorAll('[id^="o2m-add-"]').forEach(function (btn) {
      var fname = btn.id.replace('o2m-add-', '');
      var o2m = getOne2manyInfo(model, fname);
      if (!o2m) return;
      var lineFields = getOne2manyLineFields(model, fname);
      var tbody = form.querySelector('#o2m-tbody-' + fname);
      if (!tbody) return;
      btn.onclick = function () {
        tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(fname, lineFields, null, 0));
        var lastRow = tbody.lastElementChild;
        if (lastRow) {
          var delBtn = lastRow.querySelector('.o2m-delete-row');
          if (delBtn) delBtn.onclick = function () { lastRow.remove(); };
        }
      };
    });
    form.querySelectorAll('.o2m-delete-row').forEach(function (b) {
      b.onclick = function () { b.closest('tr').remove(); };
    });
  }

  function loadChatter(model, recordId, messageIds) {
    const container = document.querySelector('.chatter-messages-list');
    if (!container) return;
    container.innerHTML = '';
    if (!messageIds || !messageIds.length) {
      container.innerHTML = '<p style="color:var(--text-muted,#666);font-size:0.9rem">No messages yet.</p>';
      return;
    }
    rpc.callKw('mail.message', 'search_read', [[['id', 'in', messageIds]]], {
      fields: ['id', 'body', 'author_id', 'date'],
      order: 'id asc'
    }).then(function (rows) {
      const authorIds = [];
      rows.forEach(function (r) { if (r.author_id) authorIds.push(r.author_id); });
      const uniq = authorIds.filter(function (x, i, a) { return a.indexOf(x) === i; });
      const nameMap = {};
      const renderRows = function () {
        rows.forEach(function (r) {
          const authorName = r.author_id ? (nameMap[r.author_id] || 'User #' + r.author_id) : 'Unknown';
          const dateStr = r.date ? String(r.date).replace('T', ' ').slice(0, 16) : '';
          const body = (r.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
          container.insertAdjacentHTML('beforeend', '<div class="chatter-msg" style="padding:0.5rem 0;border-bottom:1px solid var(--border-color,#eee)"><div style="font-size:0.85rem;color:var(--text-muted,#666)">' + authorName + ' · ' + dateStr + '</div><div style="margin-top:0.25rem">' + body + '</div></div>');
        });
      };
      if (uniq.length) {
        return rpc.callKw('res.users', 'name_get', [uniq], {}).then(function (names) {
          (names || []).forEach(function (n) { if (n && n[0]) nameMap[n[0]] = n[1] || ''; });
          renderRows();
        });
      }
      renderRows();
    }).catch(function () {
      container.innerHTML = '<p style="color:var(--text-muted,#666);font-size:0.9rem">Could not load messages.</p>';
    });
  }

  function setupChatter(form, model, recordId) {
    const chatterDiv = form.querySelector('#chatter-messages');
    if (!chatterDiv || !recordId) return;
    const sendBtn = form.querySelector('#chatter-send');
    const inputEl = form.querySelector('#chatter-input');
    const sendEmailCb = form.querySelector('#chatter-send-email');
    if (sendBtn && inputEl) {
      sendBtn.onclick = function () {
        const body = (inputEl.value || '').trim();
        if (!body) return;
        sendBtn.disabled = true;
        const sendAsEmail = sendEmailCb && sendEmailCb.checked;
        rpc.callKw(model, 'message_post', [[parseInt(recordId, 10)], body], { send_as_email: sendAsEmail })
          .then(function () {
            sendBtn.disabled = false;
            inputEl.value = '';
            showToast('Message posted', 'success');
            rpc.callKw(model, 'read', [[parseInt(recordId, 10)], ['message_ids']]).then(function (recs) {
              if (recs && recs[0] && recs[0].message_ids) loadChatter(model, recordId, recs[0].message_ids);
            });
          })
          .catch(function (err) {
            sendBtn.disabled = false;
            showToast(err.message || 'Failed to post', 'error');
          });
      };
    }
  }

  function getOne2manyLineFields(model, fname) {
    var o2m = getOne2manyInfo(model, fname);
    if (!o2m) return [];
    if (model === 'crm.lead' && fname === 'activity_ids') return ['summary', 'note', 'date_deadline', 'state'];
    if (model === 'sale.order' && fname === 'order_line') return ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'];
    var meta = viewsSvc ? viewsSvc.getFieldsMeta(o2m.comodel) : null;
    if (meta) {
      var skip = ['id', (o2m.inverse || '').replace(/_id$/, '') + '_id'];
      return Object.keys(meta).filter(function (k) { return skip.indexOf(k) < 0 && meta[k].type !== 'one2many' && meta[k].type !== 'many2many'; });
    }
    return ['name'];
  }

  function getMany2manyInfo(model, fname) {
    const def = getViewFieldDef(model, fname);
    if (def && def.comodel) {
      const meta = getFieldMeta(model, fname);
      if (meta && meta.type === 'many2many') return { comodel: def.comodel };
      if (meta && meta.type === 'many2one') return null;
      return { comodel: def.comodel };
    }
    const meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'many2many' && meta.comodel) return { comodel: meta.comodel };
    return null;
  }

  function getFieldLabel(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta && meta.string) return meta.string;
    return fname.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function isTextField(model, fname) {
    const meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'text' || meta.type === 'html';
    return fname === 'description' || fname === 'note_html';
  }

  function parseDomain(str) {
    if (!str || typeof str !== 'string') return null;
    var s = str.trim();
    if (s === '1' || s === 'True') return true;
    if (s === '0' || s === 'False') return false;
    try {
      var norm = s.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/'/g, '"');
      return JSON.parse(norm);
    } catch (e) { return null; }
  }

  function evaluateDomain(domain, formVals) {
    if (domain === true) return true;
    if (domain === false) return false;
    if (!Array.isArray(domain) || domain.length === 0) return false;
    var op = domain[0];
    if (op === '|' && domain.length >= 3) return evaluateDomain(domain[1], formVals) || evaluateDomain(domain[2], formVals);
    if (op === '&' && domain.length >= 3) return evaluateDomain(domain[1], formVals) && evaluateDomain(domain[2], formVals);
    if (domain.length >= 3 && typeof domain[0] === 'string') {
      var field = domain[0], op2 = domain[1], value = domain[2];
      var v = formVals[field];
      if (op2 === '=') return v == value;
      if (op2 === '!=') return v != value;
      if (op2 === '>') return v > value;
      if (op2 === '<') return v < value;
      if (op2 === '>=') return v >= value;
      if (op2 === '<=') return v <= value;
      if (op2 === 'in') return Array.isArray(value) && value.indexOf(v) >= 0;
      if (op2 === 'not in') return !Array.isArray(value) || value.indexOf(v) < 0;
    }
    return false;
  }

  function evaluateCondition(domainStr, formVals) {
    var domain = parseDomain(domainStr);
    return domain !== null ? evaluateDomain(domain, formVals) : false;
  }

  function applyAttrsToForm(form, model) {
    var formVals = getFormVals(form, model);
    form.querySelectorAll('.attr-field').forEach(function (wrapper) {
      var fname = wrapper.getAttribute('data-fname');
      var invStr = wrapper.getAttribute('data-invisible');
      var roStr = wrapper.getAttribute('data-readonly');
      var reqStr = wrapper.getAttribute('data-required-cond');
      var inv = invStr ? evaluateCondition(invStr, formVals) : false;
      var ro = roStr ? evaluateCondition(roStr, formVals) : false;
      var req = reqStr ? evaluateCondition(reqStr, formVals) : false;
      wrapper.classList.toggle('o-invisible', !!inv);
      var inputs = wrapper.querySelectorAll('input:not([type="hidden"]), select, textarea');
      var forRequired = wrapper.querySelector('[name="' + fname + '"]');
      inputs.forEach(function (el) { el.disabled = !!ro; });
      if (forRequired) forRequired.required = !!req;
    });
  }

  function renderFieldHtml(model, f) {
    const fname = typeof f === 'object' ? f.name : f;
    const label = getFieldLabel(model, fname);
    const widget = typeof f === 'object' ? f.widget : '';
    if (widget === 'statusbar') {
      var sbId = 'statusbar-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + '</label><div class="o-statusbar" id="' + sbId + '" data-fname="' + fname + '" data-comodel="' + (f.comodel || '') + '" data-clickable="1" style="margin-top:0.25rem;display:flex;align-items:center;gap:0;flex-wrap:wrap"></div><input type="hidden" name="' + fname + '"></p>';
    }
    const o2m = getOne2manyInfo(model, fname);
    const m2m = getMany2manyInfo(model, fname);
    if (fname === 'message_ids' && model === 'crm.lead') {
      return '<p><label>' + label + '</label><div id="chatter-messages" class="o-chatter" data-model="' + model + '" style="margin-top:0.5rem;padding:var(--space-md,0.75rem);background:var(--color-bg,#f5f5f5);border-radius:var(--radius-md,8px);border:1px solid var(--border-color,#ddd)"><div class="chatter-messages-list" style="max-height:200px;overflow-y:auto;margin-bottom:var(--space-md,0.75rem)"></div><div class="chatter-compose"><textarea id="chatter-input" placeholder="Add a comment..." style="width:100%;min-height:60px;padding:0.5rem;border:1px solid var(--border-color,#ddd);border-radius:4px;resize:vertical"></textarea><label style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;font-size:0.9rem;cursor:pointer"><input type="checkbox" id="chatter-send-email"> Send as email</label><button type="button" id="chatter-send" style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--color-primary,#1a1a2e);color:white;border:none;border-radius:4px;cursor:pointer">Send</button></div></div></p>';
    }
    if (o2m) {
      var lineFields = getOne2manyLineFields(model, fname);
      var headers = lineFields.map(function (lf) { return '<th style="text-align:left;padding:0.35rem">' + (lf.charAt(0).toUpperCase() + lf.slice(1)) + '</th>'; }).join('');
      var rowHtml = lineFields.map(function (lf) { return '<td style="padding:0.25rem"><input type="text" data-o2m-field="' + lf + '" style="width:100%;padding:0.25rem;font-size:0.9rem" placeholder="' + lf + '"></td>'; }).join('');
      var addId = 'o2m-add-' + fname;
      return '<p><label>' + label + '</label><div id="o2m-' + fname + '" data-comodel="' + (o2m.comodel || '') + '" data-inverse="' + (o2m.inverse || '') + '" data-fname="' + fname + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px"><table style="width:100%;font-size:0.9rem"><thead><tr>' + headers + '<th style="width:1%"></th></tr></thead><tbody id="o2m-tbody-' + fname + '"></tbody></table><button type="button" id="' + addId + '" style="margin-top:0.25rem;padding:0.25rem 0.5rem;font-size:0.85rem;cursor:pointer">Add</button></div></p>';
    }
    if (m2m) {
      const tagsClass = (widget === 'many2many_tags') ? ' m2m-tags' : '';
      return '<p><label>' + label + '</label><div id="m2m-' + fname + '" class="m2m-widget' + tagsClass + '" data-comodel="' + (m2m.comodel || '') + '" data-widget="' + (widget || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em;display:flex;flex-wrap:wrap;gap:0.25rem"></div></p>';
    }
    const meta = getFieldMeta(model, fname);
    const required = (meta && meta.required) || fname === 'name';
    const comodel = getMany2oneComodel(model, fname);
    const selectionOpts = getSelectionOptions(model, fname);
    const isBool = isBooleanField(model, fname);
    const isImg = isImageField(model, fname);
    const isBin = isBinaryField(model, fname);
    const isHtml = isHtmlField(model, fname);
    const isTextarea = isTextField(model, fname) && !isHtml;
    const isMonetary = isMonetaryField(model, fname);
    const inputType = isImg ? 'image' : (isBin ? 'binary' : (isHtml ? 'html' : (isBool ? 'boolean' : (isMonetary ? 'monetary' : (fname === 'email' ? 'email' : isTextarea ? 'textarea' : selectionOpts ? 'selection' : (comodel ? 'many2one' : 'text'))))));
    if (inputType === 'boolean') return '<p><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="' + fname + '"> ' + label + '</label></p>';
    if (inputType === 'html') return '<p><label>' + label + (required ? ' *' : '') + '</label><div id="html-' + fname + '" class="html-widget" data-fname="' + fname + '" contenteditable="true" style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:6em;border:1px solid var(--border-color,#ddd);border-radius:4px;background:#fff"></div><input type="hidden" name="' + fname + '" id="hidden-html-' + fname + '"></p>';
    if (inputType === 'textarea') return '<p><label>' + label + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
    if (inputType === 'selection') {
      let opts = '<option value="">--</option>';
      selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
      return '<p><label>' + label + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem">' + opts + '</select></label></p>';
    }
    if (inputType === 'many2one') {
      const domainInfo = getMany2oneDomain(model, fname);
      const depAttr = domainInfo ? ' data-depends-on="' + domainInfo.depField + '"' : '';
      const wid = 'm2o-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + (required ? ' *' : '') + '</label><div class="m2one-widget" id="' + wid + '" data-comodel="' + (comodel || '') + '" data-fname="' + fname + '" data-domain="' + (domainInfo ? encodeURIComponent(JSON.stringify(domainInfo)) : '') + '"' + depAttr + ' style="margin-top:0.25rem;position:relative"><input type="text" class="m2one-input" placeholder="Search..." autocomplete="off" style="width:100%;padding:0.5rem"><input type="hidden" name="' + fname + '" class="m2one-value"><div class="m2one-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #ddd;border-radius:4px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 4px 8px rgba(0,0,0,0.1)"></div></div></p>';
    }
    if (inputType === 'binary') return '<p><label>' + label + '<br><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="*/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem"></span></label></p>';
    if (inputType === 'image') return '<p><label>' + label + '</label><div id="image-' + fname + '" class="image-widget" data-fname="' + fname + '" style="margin-top:0.25rem"><img id="img-preview-' + fname + '" src="" alt="" style="max-width:200px;max-height:150px;display:none;border-radius:4px;border:1px solid var(--border-color,#ddd)"><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="image/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem;display:block;margin-top:0.25rem"></span></div></p>';
    if (inputType === 'monetary') return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="number" name="' + fname + '" step="0.01" min="0" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
    return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
  }

  function renderFormTreeToHtml(model, children, opts) {
    opts = opts || {};
    var recordId = opts.recordId;
    var route = opts.route || '';
    var isNew = opts.isNew;
    let html = '';
    (children || []).forEach(function (c) {
      if (c.type === 'header') {
        html += '<div class="o-form-header">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'sheet') {
        html += '<div class="o-form-sheet">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button_box') {
        html += '<div class="o-button-box">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button') {
        var btnName = c.name || '';
        var btnStr = (c.string || btnName).replace(/</g, '&lt;');
        html += '<button type="button" class="btn-action-object' + (c.class ? ' ' + c.class : '') + '" data-action="' + btnName + '" style="padding:0.35rem 0.75rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;font-size:0.9rem">' + btnStr + '</button>';
      } else if (c.type === 'field') {
        var fieldHtml = renderFieldHtml(model, c);
        var fname = c.name || '';
        if ((c.invisible || c.readonly || c.required_cond) && fieldHtml) {
          var ad = (c.invisible ? ' data-invisible="' + String(c.invisible).replace(/"/g, '&quot;') + '"' : '') + (c.readonly ? ' data-readonly="' + String(c.readonly).replace(/"/g, '&quot;') + '"' : '') + (c.required_cond ? ' data-required-cond="' + String(c.required_cond).replace(/"/g, '&quot;') + '"' : '');
          html += '<div class="attr-field" data-fname="' + fname + '"' + ad + '>' + fieldHtml + '</div>';
        } else if (fieldHtml) {
          html += '<div class="attr-field" data-fname="' + fname + '">' + fieldHtml + '</div>';
        }
      }
      else if (c.type === 'group') {
        html += '<div class="form-group">';
        if (c.string) html += '<div class="form-group-title">' + (c.string || '').replace(/</g, '&lt;') + '</div>';
        html += renderFormTreeToHtml(model, c.children || [], opts);
        html += '</div>';
      } else if (c.type === 'notebook' && c.pages && c.pages.length) {
        const nbId = 'nb-' + Math.random().toString(36).slice(2);
        html += '<div class="form-notebook" id="' + nbId + '"><div class="notebook-tabs">';
        c.pages.forEach(function (p, i) {
          html += '<button type="button" class="notebook-tab' + (i === 0 ? ' active' : '') + '" data-page="' + i + '">' + (p.string || 'Tab').replace(/</g, '&lt;') + '</button>';
        });
        html += '</div>';
        c.pages.forEach(function (p, i) {
          html += '<div class="notebook-page' + (i === 0 ? ' active' : '') + '" data-page="' + i + '">' + renderFormTreeToHtml(model, p.children || [], opts) + '</div>';
        });
        html += '</div>';
      }
    });
    return html;
  }

  function renderForm(model, route, id) {
    formDirty = false;
    if (typeof window !== 'undefined') window.chatContext = { model: model, active_id: id ? parseInt(id, 10) : null };
    const fields = getFormFields(model);
    const formView = viewsSvc ? viewsSvc.getView(model, 'form') : null;
    const children = formView && formView.children ? formView.children : null;
    const title = getTitle(route);
    const isNew = !id;
    const formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    if (actionStack.length === 0 || actionStack[actionStack.length - 1].hash !== route) {
      if (actionStack.length === 0) pushBreadcrumb(title, route);
      pushBreadcrumb(formTitle, isNew ? route + '/new' : route + '/edit/' + id);
    }
    let html = renderBreadcrumbs();
    html += '<h2>' + formTitle + '</h2>';
    html += '<div id="form-dirty-banner" class="form-dirty-banner" style="display:none">You have unsaved changes</div>';
    html += '<form id="record-form" style="max-width:600px">';
    if (children && children.length) {
      html += renderFormTreeToHtml(model, children, { recordId: id, route: route, isNew: isNew });
    } else {
      fields.forEach(function (f) {
        var fname = typeof f === 'object' ? f.name : f;
        html += '<div class="attr-field" data-fname="' + (fname || '') + '">' + renderFieldHtml(model, f) + '</div>';
      });
    }
    html += '<p><button type="submit" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Save</button> ';
    html += '<a href="#' + route + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
    if (isNew && (model === 'crm.lead' || model === 'res.partner')) {
      html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
    }
    if (!isNew) {
      html += ' <button type="button" id="btn-duplicate" style="margin-left:0.5rem;padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">Duplicate</button>';
      const reportName = getReportName(model);
      if (reportName) html += ' <a href="/report/html/' + reportName + '/' + id + '" target="_blank" rel="noopener" id="btn-print-form" style="margin-left:0.5rem;padding:0.5rem 1rem;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;text-decoration:none;color:inherit">Print</a>';
      html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
    }
    html += '</p></form>';
    main.innerHTML = html;
    const form = document.getElementById('record-form');
    fields.forEach(f => {
      const fn = typeof f === 'object' ? f.name : f;
      if (isHtmlField(model, fn)) {
        const htmlDiv = document.getElementById('html-' + fn);
        const hiddenIn = document.getElementById('hidden-html-' + fn);
        if (htmlDiv && hiddenIn) {
          const syncHtml = function () { hiddenIn.value = htmlDiv.innerHTML || ''; };
          htmlDiv.addEventListener('input', syncHtml);
          htmlDiv.addEventListener('blur', syncHtml);
        }
      }
      if (isBinaryField(model, fn) || isImageField(model, fn)) {
        const fileIn = document.getElementById('file-' + fn);
        const hiddenIn = document.getElementById('hidden-' + fn);
        const statusSpan = document.getElementById('bin-status-' + fn);
        const imgPreview = document.getElementById('img-preview-' + fn);
        if (fileIn && hiddenIn) {
          fileIn.onchange = function () {
            const file = fileIn.files && fileIn.files[0];
            if (!file) { hiddenIn.value = ''; if (statusSpan) statusSpan.textContent = ''; if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; } return; }
            const r = new FileReader();
            r.onload = function () {
              const dataUrl = r.result;
              const base64 = (dataUrl && dataUrl.indexOf(',') >= 0) ? dataUrl.split(',')[1] : '';
              hiddenIn.value = base64;
              if (statusSpan) statusSpan.textContent = file.name + ' (' + (file.size < 1024 ? file.size + ' B' : (file.size / 1024).toFixed(1) + ' KB') + ')';
              if (imgPreview && file.type && file.type.startsWith('image/')) {
                imgPreview.src = dataUrl;
                imgPreview.style.display = 'block';
              }
            };
            r.readAsDataURL(file);
          };
        }
      }
    });
    main.querySelectorAll('.btn-action-object').forEach(function (btn) {
      var actionName = btn.getAttribute('data-action');
      if (!actionName || isNew) return;
      btn.onclick = function () {
        btn.disabled = true;
        rpc.callKw(model, actionName, [[parseInt(id, 10)]], {})
          .then(function () {
            btn.disabled = false;
            showToast('Action completed', 'success');
            renderForm(model, route, id);
          })
          .catch(function (err) {
            btn.disabled = false;
            showToast(err.message || 'Action failed', 'error');
          });
      };
    });
    main.querySelectorAll('.form-notebook').forEach(function (nb) {
      const tabs = nb.querySelectorAll('.notebook-tab');
      const pages = nb.querySelectorAll('.notebook-page');
      tabs.forEach(function (tab, i) {
        tab.onclick = function () {
          tabs.forEach(function (t) { t.classList.remove('active'); });
          pages.forEach(function (p) { p.classList.remove('active'); });
          tab.classList.add('active');
          const page = nb.querySelector('.notebook-page[data-page="' + i + '"]');
          if (page) page.classList.add('active');
        };
      });
    });
    const selects = form.querySelectorAll('select[data-comodel]');
    const m2oneWidgets = form.querySelectorAll('.m2one-widget');
    const m2mDivs = form.querySelectorAll('[id^="m2m-"]');
    const m2oneSearchDebounce = {};
    const setupM2oneWidget = function (widget) {
      const comodel = widget.dataset.comodel;
      const fname = widget.dataset.fname;
      if (!comodel) return;
      const inputEl = widget.querySelector('.m2one-input');
      const valueEl = widget.querySelector('.m2one-value');
      const dropdownEl = widget.querySelector('.m2one-dropdown');
      if (!inputEl || !valueEl || !dropdownEl) return;
      const getDomain = function () {
        try {
          const d = widget.dataset.domain;
          if (!d) return [];
          const info = JSON.parse(decodeURIComponent(d));
          const depVal = getFormFieldVal(info.depField);
          return depVal ? [[info.depField, '=', depVal]] : [[info.depField, '=', 0]];
        } catch (e) { return []; }
      };
      const doSearch = function () {
        const term = (inputEl.value || '').trim();
        const domain = getDomain();
        rpc.callKw(comodel, 'name_search', [term, domain, 'ilike', 8], {})
          .then(function (results) {
            dropdownEl.innerHTML = '';
            dropdownEl.style.display = results.length ? 'block' : 'none';
            results.forEach(function (r) {
              const id = r[0], name = r[1] || String(id);
              const item = document.createElement('div');
              item.className = 'm2one-dropdown-item';
              item.style.cssText = 'padding:0.5rem;cursor:pointer';
              item.textContent = name;
              item.dataset.id = id;
              item.dataset.name = name;
              item.onmouseover = function () { item.style.background = '#f0f0f0'; };
              item.onmouseout = function () { item.style.background = ''; };
              item.onclick = function () {
                valueEl.value = id;
                inputEl.value = name;
                dropdownEl.style.display = 'none';
                inputEl.dataset.display = name;
                form.querySelectorAll('.m2one-widget[data-depends-on="' + fname + '"]').forEach(function (w) {
                  const v = w.querySelector('.m2one-value');
                  const i = w.querySelector('.m2one-input');
                  if (v) v.value = '';
                  if (i) { i.value = ''; delete i.dataset.display; }
                });
                runServerOnchange(fname);
              };
              dropdownEl.appendChild(item);
            });
          })
          .catch(function () { dropdownEl.style.display = 'none'; });
      };
      inputEl.onfocus = function () {
        if (valueEl.value && inputEl.dataset.display) return;
        if ((inputEl.value || '').trim().length >= 2) doSearch();
        else if (!valueEl.value) {
          rpc.callKw(comodel, 'name_search', ['', getDomain(), 'ilike', 8], {}).then(function (results) {
            dropdownEl.innerHTML = '';
            dropdownEl.style.display = results.length ? 'block' : 'none';
            results.forEach(function (r) {
              const item = document.createElement('div');
              item.className = 'm2one-dropdown-item';
              item.style.cssText = 'padding:0.5rem;cursor:pointer';
              item.textContent = r[1] || String(r[0]);
              item.dataset.id = r[0];
              item.dataset.name = r[1] || String(r[0]);
              item.onclick = function () {
                valueEl.value = item.dataset.id;
                inputEl.value = item.dataset.name;
                inputEl.dataset.display = item.dataset.name;
                dropdownEl.style.display = 'none';
                runServerOnchange(fname);
              };
              dropdownEl.appendChild(item);
            });
          });
        }
      };
      inputEl.oninput = function () {
        const key = fname;
        if (m2oneSearchDebounce[key]) clearTimeout(m2oneSearchDebounce[key]);
        valueEl.value = '';
        delete inputEl.dataset.display;
        m2oneSearchDebounce[key] = setTimeout(function () {
          m2oneSearchDebounce[key] = null;
          if ((inputEl.value || '').trim().length >= 2) doSearch();
          else dropdownEl.style.display = 'none';
        }, 300);
      };
      inputEl.onblur = function () {
        setTimeout(function () {
          dropdownEl.style.display = 'none';
          if (valueEl.value && !inputEl.dataset.display) {
            rpc.callKw(comodel, 'name_get', [[parseInt(valueEl.value, 10)]], {}).then(function (res) {
              if (res && res[0]) inputEl.dataset.display = res[0][1];
            });
          }
        }, 200);
      };
      var depAttr = widget.getAttribute('data-depends-on');
      if (depAttr) {
        const depWidget = form.querySelector('.m2one-widget[data-fname="' + depAttr + '"]');
        const depInput = depWidget ? depWidget.querySelector('.m2one-input') : form.querySelector('[name="' + depAttr + '"]');
        if (depInput) {
          depInput.addEventListener('input', function () {
            valueEl.value = '';
            inputEl.value = '';
            delete inputEl.dataset.display;
          });
          depInput.addEventListener('change', function () {
            valueEl.value = '';
            inputEl.value = '';
            delete inputEl.dataset.display;
          });
        }
      }
    };
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
    m2oneWidgets.forEach(function (w) { setupM2oneWidget(w); });
    const statusbars = form.querySelectorAll('.o-statusbar');
    const setupStatusbar = function (sb, options, currentVal, isNew) {
      sb.innerHTML = '';
      var clickable = sb.getAttribute('data-clickable') !== '0';
      var fname = sb.dataset.fname;
      var hiddenInput = form.querySelector('input[name="' + fname + '"]');
      if (!hiddenInput) return;
      var currentId = currentVal != null ? parseInt(currentVal, 10) : null;
      if (currentId != null) hiddenInput.value = currentId;
      var currentIdx = -1;
      if (currentId != null) {
        for (var i = 0; i < options.length; i++) {
          if ((options[i].id != null ? options[i].id : options[i][0]) == currentId) { currentIdx = i; break; }
        }
      }
      options.forEach(function (opt, idx) {
        var item = document.createElement('span');
        item.className = 'o-statusbar-item';
        var optId = opt.id != null ? opt.id : opt[0];
        var optName = opt.name != null ? opt.name : (opt[1] || opt[0]);
        item.textContent = optName;
        item.dataset.value = optId;
        if (optId == currentId || (currentId == null && idx === 0)) item.classList.add('o-statusbar-item--active');
        if (currentIdx >= 0 && idx < currentIdx) item.classList.add('o-statusbar-item--done');
        if (clickable) {
          item.style.cursor = 'pointer';
          item.onclick = function () {
            const val = parseInt(item.dataset.value, 10);
            hiddenInput.value = val;
            if (isNew) {
              statusbars.forEach(function (s) {
                if (s.dataset.fname === fname) {
                  s.querySelectorAll('.o-statusbar-item').forEach(function (i) { i.classList.remove('o-statusbar-item--active'); });
                  item.classList.add('o-statusbar-item--active');
                }
              });
            } else {
              rpc.callKw(model, 'write', [[parseInt(id, 10)], { [fname]: val }], {})
                .then(function () {
                  showToast('Stage updated', 'success');
                  loadRecord(model, id).then(function (r) {
                    if (r && r[0]) {
                      var rec = r[0];
                      statusbars.forEach(function (s) {
                        if (s.dataset.fname === fname) {
                          s.querySelectorAll('.o-statusbar-item').forEach(function (i) {
                            i.classList.remove('o-statusbar-item--active', 'o-statusbar-item--done');
                            if (parseInt(i.dataset.value, 10) === rec[fname]) i.classList.add('o-statusbar-item--active');
                          });
                        }
                      });
                    }
                  });
                })
                .catch(function (err) { showToast(err.message || 'Failed to update', 'error'); });
            }
          };
        }
        sb.appendChild(item);
        if (idx < options.length - 1) {
          var sep = document.createElement('span');
          sep.className = 'o-statusbar-sep';
          sep.textContent = '>';
          sep.style.margin = '0 0.25rem';
          sb.appendChild(sep);
        }
      });
    };
    const renderM2mTags = function (div, fname, opts, selectedIds, nameMap, onchange) {
      const idSet = (selectedIds || []).map(function (x) { return String(x); });
      let html = '';
      (selectedIds || []).forEach(function (id) {
        const name = nameMap[id] || ('#' + id);
        html += '<span class="m2m-tag-chip" data-id="' + id + '" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--color-primary,#1a1a2e);color:white;border-radius:999px;font-size:0.85rem">' + String(name).replace(/</g, '&lt;') + ' <span class="m2m-tag-remove" style="cursor:pointer;opacity:0.8">×</span></span>';
      });
      const unselected = opts.filter(function (o) { return idSet.indexOf(String(o.id)) < 0; });
      html += '<select class="m2m-tag-add" data-fname="' + fname + '" style="min-width:8rem;padding:0.2rem 0.5rem;font-size:0.85rem;border:1px dashed #999;border-radius:4px;background:transparent"><option value="">+ Add</option>';
      unselected.forEach(function (o) {
        html += '<option value="' + o.id + '">' + String(o.name || o.id).replace(/</g, '&lt;') + '</option>';
      });
      html += '</select>';
      div.innerHTML = html;
      div.querySelectorAll('.m2m-tag-chip').forEach(function (chip) {
        const remove = chip.querySelector('.m2m-tag-remove');
        if (remove) {
          remove.onclick = function () {
            const id = parseInt(chip.dataset.id, 10);
            let ids = [];
            try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
            ids = ids.filter(function (x) { return x !== id; });
            div.dataset.selected = JSON.stringify(ids);
            renderM2mTags(div, fname, opts, ids, nameMap, onchange);
            if (onchange) onchange(fname);
          };
        }
      });
      const addSel = div.querySelector('.m2m-tag-add');
      if (addSel) {
        addSel.onchange = function () {
          const val = addSel.value;
          if (!val) return;
          const id = parseInt(val, 10);
          let ids = [];
          try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
          if (ids.indexOf(id) >= 0) return;
          ids.push(id);
          div.dataset.selected = JSON.stringify(ids);
          const o = opts.filter(function (x) { return x.id === id; })[0];
          const nm = o ? (o.name || String(id)) : String(id);
          if (!nameMap[id]) nameMap[id] = nm;
          renderM2mTags(div, fname, opts, ids, nameMap, onchange);
          addSel.value = '';
          if (onchange) onchange(fname);
        };
      }
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
        const isTags = div.dataset.widget === 'many2many_tags';
        const selectedIds = (formVals && formVals[fname]) ? (Array.isArray(formVals[fname]) ? formVals[fname] : [formVals[fname]]) : [];
        if (!comodel) return;
        promises.push(
          rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], limit: 200 })
            .then(function (opts) {
              const nameMap = {};
              opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
              if (isTags) {
                div.dataset.opts = JSON.stringify(opts);
                div.dataset.selected = JSON.stringify(selectedIds);
                renderM2mTags(div, fname, opts, selectedIds, nameMap, runServerOnchange);
              } else {
                let inner = '';
                const idSet = selectedIds.map(function (x) { return String(x); });
                opts.forEach(function (o) {
                  const checked = idSet.indexOf(String(o.id)) >= 0 ? ' checked' : '';
                  inner += '<label style="display:inline-block;margin-right:1rem;margin-bottom:0.25rem"><input type="checkbox" name="' + fname + '_cb" value="' + o.id + '"' + checked + '> ' + (o.name || o.id).replace(/</g, '&lt;') + '</label>';
                });
                div.innerHTML = inner || 'No options';
              }
            })
        );
      });
      statusbars.forEach(function (sb) {
        var comodel = sb.dataset.comodel;
        var fname = sb.dataset.fname;
        var currentVal = formVals ? formVals[fname] : getFormFieldVal(fname);
        if (comodel) {
          promises.push(
            rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence', limit: 50 })
              .then(function (opts) {
                setupStatusbar(sb, opts, currentVal, isNew);
              })
          );
        } else {
          var selOpts = getSelectionOptions(model, fname);
          if (selOpts) {
            setupStatusbar(sb, selOpts, currentVal, isNew);
          }
        }
      });
      return Promise.all(promises);
    };
    const onchangeDebounce = {};
    const runServerOnchange = function (fieldName) {
      const key = fieldName || '';
      if (onchangeDebounce[key]) clearTimeout(onchangeDebounce[key]);
      onchangeDebounce[key] = setTimeout(function () {
        onchangeDebounce[key] = null;
        const vals = getFormVals(form, model);
        rpc.callKw(model, 'onchange', [fieldName, vals], {}).then(function (updates) {
          if (!updates || typeof updates !== 'object') return;
          Object.keys(updates).forEach(function (n) {
            const v = updates[n];
            const el = form.querySelector('[name="' + n + '"]');
            if (!el) return;
            if (el.type === 'checkbox') {
              el.checked = !!v;
            } else {
              el.value = v != null ? v : '';
            }
          });
          applyAttrsToForm(form, model);
        }).catch(function () {});
      }, 300);
    };
    const setupDependsOnHandlers = function () {
      selects.forEach(function (sel) {
        const fname = sel.getAttribute('name');
        const domainInfo = getMany2oneDomain(model, fname);
        if (!domainInfo) return;
        const depEl = form.querySelector('[name="' + domainInfo.depField + '"]');
        if (depEl) {
          depEl.onchange = function () {
            runServerOnchange(domainInfo.depField);
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
    const setupOnchangeHandlers = function () {
      form.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (el) {
        if (el.type === 'file' || (el.name || '').indexOf('_cb') >= 0) return;
        const fieldName = el.getAttribute('name');
        if (!fieldName) return;
        const ev = el.tagName === 'TEXTAREA' || (el.type === 'text' || el.type === 'email') ? 'blur' : 'change';
        el.addEventListener(ev, function () { runServerOnchange(fieldName); });
      });
    };
    const setM2mChecked = function (fname, ids) {
      const div = form.querySelector('#m2m-' + fname);
      if (div && div.dataset.widget === 'many2many_tags') {
        let opts = [];
        try { opts = JSON.parse(div.dataset.opts || '[]'); } catch (e) {}
        const nameMap = {};
        opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
        div.dataset.selected = JSON.stringify(ids || []);
        renderM2mTags(div, fname, opts, ids || [], nameMap, runServerOnchange);
        return;
      }
      const idSet = (ids || []).map(function (x) { return String(x); });
      form.querySelectorAll('input[name="' + fname + '_cb"]').forEach(function (cb) {
        cb.checked = idSet.indexOf(String(cb.value)) >= 0;
      });
    };
    if (isNew) {
      const action = getActionForRoute(route);
      const context = (action && action.context) ? (typeof action.context === 'string' ? {} : action.context) : {};
      const fieldNames = fields.map(function (f) { return typeof f === 'object' ? f.name : f; });
      const applyDefaults = function (defaults) {
        if (!defaults || typeof defaults !== 'object') return;
        Object.keys(defaults).forEach(function (n) {
          const m2m = getMany2manyInfo(model, n);
          const m2oComodel = getMany2oneComodel(model, n);
          if (m2m) {
            setM2mChecked(n, Array.isArray(defaults[n]) ? defaults[n] : (defaults[n] ? [defaults[n]] : []));
          } else if (m2oComodel) {
            const widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
            if (widget) {
              const vEl = widget.querySelector('.m2one-value');
              const iEl = widget.querySelector('.m2one-input');
              const id = defaults[n];
              if (vEl) vEl.value = id != null ? String(id) : '';
              if (iEl) {
                if (id) {
                  rpc.callKw(m2oComodel, 'name_get', [[parseInt(id, 10)]], {}).then(function (res) {
                    if (res && res[0]) { iEl.value = res[0][1]; iEl.dataset.display = res[0][1]; }
                  });
                } else iEl.value = '';
              }
            }
          } else {
            const el = form.querySelector('[name="' + n + '"]');
            if (el) {
              if (el.type === 'checkbox') el.checked = !!defaults[n];
              else el.value = defaults[n] != null ? String(defaults[n]) : '';
            }
          }
        });
      };
      rpc.callKw(model, 'default_get', [fieldNames], { context: context })
        .then(function (defaults) {
          applyDefaults(defaults);
          return loadOptions(defaults || {});
        })
        .then(function () { setupDependsOnHandlers(); setupOnchangeHandlers(); applyAttrsToForm(form, model); })
        .catch(function () { loadOptions({}).then(function () { setupDependsOnHandlers(); setupOnchangeHandlers(); applyAttrsToForm(form, model); }); });
      setupOne2manyAddButtons(form, model);
      form.onsubmit = (e) => { e.preventDefault(); createRecord(model, route, form); return false; };
    } else {
      loadRecord(model, id).then(function (r) {
        if (r && r[0]) {
          const rec = r[0];
          try {
            const key = 'erp_recent_items';
            const name = (rec.name || rec.display_name || 'Item').toString();
            let arr = [];
            try { arr = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (e) {}
            arr = arr.filter(function (x) { return !(x.route === route && x.id == id); });
            arr.unshift({ id: rec.id, name: name, route: route });
            sessionStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
          } catch (e) {}
          if (rec.name && actionStack.length > 0) {
            actionStack[actionStack.length - 1].label = rec.name;
            var bcNav = main.querySelector('.breadcrumbs');
            if (bcNav) bcNav.outerHTML = renderBreadcrumbs();
            attachBreadcrumbHandlers();
          }
          return loadOptions(rec).then(function () {
            setupDependsOnHandlers();
            setupOnchangeHandlers();
            applyAttrsToForm(form, model);
            const set = (n, v) => { const el = form.querySelector('[name="' + n + '"]'); if (el) el.value = v != null ? v : ''; };
            fields.forEach(f => {
            const n = typeof f === 'object' ? f.name : f;
            const o2m = getOne2manyInfo(model, n);
            const m2m = getMany2manyInfo(model, n);
            if (m2m) {
              setM2mChecked(n, rec[n]);
            } else if (n === 'message_ids' && model === 'crm.lead') {
              loadChatter(model, id, rec[n]);
              setupChatter(form, model, id);
            } else if (o2m) {
              const div = form.querySelector('#o2m-' + n);
              const tbody = div && div.querySelector('#o2m-tbody-' + n);
              if (tbody && rec[n] && Array.isArray(rec[n]) && rec[n].length) {
                var lineFields = getOne2manyLineFields(model, n);
                var o2mFields = ['id'].concat(lineFields);
                rpc.callKw(o2m.comodel, 'search_read', [[['id', 'in', rec[n]]]], { fields: o2mFields })
                  .then(function (rows) {
                    var lineFields = getOne2manyLineFields(model, n);
                    rows.forEach(function (row) {
                      tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(n, lineFields, row, 0));
                    });
                    setupOne2manyAddButtons(form, model);
                  })
                  .catch(function () { if (tbody) tbody.innerHTML = '<tr><td colspan="4">—</td></tr>'; });
              } else if (div) {
                setupOne2manyAddButtons(form, model);
              }
            } else if (isBooleanField(model, n)) {
              const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
              if (cb) cb.checked = !!rec[n];
            } else if (isHtmlField(model, n)) {
              const htmlDiv = document.getElementById('html-' + n);
              const hiddenIn = document.getElementById('hidden-html-' + n);
              const val = rec[n] || '';
              if (htmlDiv) htmlDiv.innerHTML = val;
              if (hiddenIn) hiddenIn.value = val;
            } else if (isImageField(model, n)) {
              const imgPreview = document.getElementById('img-preview-' + n);
              const statusSpan = document.getElementById('bin-status-' + n);
              const hiddenIn = form.querySelector('[name="' + n + '"]');
              if (rec[n] && imgPreview) {
                imgPreview.src = 'data:image/png;base64,' + rec[n];
                imgPreview.style.display = 'block';
              }
              if (statusSpan && rec[n]) statusSpan.textContent = 'Image attached';
            } else if (isBinaryField(model, n)) {
              const statusSpan = document.getElementById('bin-status-' + n);
              if (statusSpan && rec[n]) statusSpan.textContent = 'File attached';
            } else if (getMany2oneComodel(model, n)) {
              const widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
              if (widget) {
                const vEl = widget.querySelector('.m2one-value');
                const iEl = widget.querySelector('.m2one-input');
                const id = rec[n];
                if (vEl) vEl.value = id != null ? String(id) : '';
                if (iEl) {
                  const display = rec[n + '_display'];
                  if (display) {
                    iEl.value = display;
                    iEl.dataset.display = display;
                  } else if (id) {
                    rpc.callKw(getMany2oneComodel(model, n), 'name_get', [[parseInt(id, 10)]], {}).then(function (res) {
                      if (res && res[0]) { iEl.value = res[0][1]; iEl.dataset.display = res[0][1]; }
                    });
                  } else iEl.value = '';
                }
              }
            } else {
              set(n, rec[n]);
            }
          });
          });
        }
      }).catch(function () {});
      form.onsubmit = (e) => { e.preventDefault(); updateRecord(model, route, id, form); return false; };
      var btnDup = document.getElementById('btn-duplicate');
      var btnDel = document.getElementById('btn-delete-form');
      if (btnDup) btnDup.onclick = function () {
        rpc.callKw(model, 'copy', [[parseInt(id, 10)]], {})
          .then(function (newRec) {
            var newId = typeof newRec === 'number' ? newRec : ((newRec && newRec.ids && newRec.ids[0]) || (newRec && newRec.id));
            if (newId) {
              showToast('Record duplicated', 'success');
              window.location.hash = route + '/edit/' + newId;
            }
          })
          .catch(function (err) { showToast(err.message || 'Failed to duplicate', 'error'); });
      };
      if (btnDel) btnDel.onclick = function (e) { e.preventDefault(); if (confirm('Delete this record?')) deleteRecord(model, route, id); };
    }
    const btnAiFill = document.getElementById('btn-ai-fill');
    if (btnAiFill) {
      btnAiFill.onclick = function () {
        const text = prompt('Paste text (email, signature, lead description, etc.) to extract fields:');
        if (!text || !text.trim()) return;
        btnAiFill.disabled = true;
        btnAiFill.textContent = '...';
        fetch('/ai/extract_fields', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, text: text.trim() })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.error) { showToast(data.error || 'AI extract failed', 'error'); return; }
            const fields = data.fields || {};
            const form = document.getElementById('record-form');
            if (!form) return;
            Object.keys(fields).forEach(function (fname) {
              const val = fields[fname];
              if (val == null) return;
              const strVal = String(val);
              const el = form.querySelector('[name="' + fname + '"]');
              if (el) {
                if (el.tagName === 'TEXTAREA') el.value = strVal;
                else if (el.type === 'checkbox') el.checked = !!val;
                else el.value = strVal;
              }
              const htmlDiv = document.getElementById('html-' + fname);
              const hiddenHtml = document.getElementById('hidden-html-' + fname);
              if (htmlDiv && hiddenHtml) { htmlDiv.innerHTML = strVal; hiddenHtml.value = strVal; }
            });
            formDirty = true;
            if (typeof updateDirtyBanner === 'function') updateDirtyBanner();
            showToast('Fields filled from AI extraction', 'success');
          })
          .catch(function (err) { showToast(err.message || 'AI extract failed', 'error'); })
          .finally(function () { btnAiFill.disabled = false; btnAiFill.textContent = 'AI Fill'; });
      };
    }
    attachBreadcrumbHandlers();
  }

  function getFormVals(form, model) {
    form.querySelectorAll('.html-widget').forEach(function (div) {
      const fname = div.dataset.fname;
      const hidden = document.getElementById('hidden-html-' + fname);
      if (hidden) hidden.value = div.innerHTML || '';
    });
    const fields = getFormFields(model);
    const byName = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    const vals = {};
    fields.forEach(f => {
      const n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      const o2m = getOne2manyInfo(model, n);
      if (o2m) {
        var tbody = form.querySelector('#o2m-tbody-' + n);
        if (tbody) {
          var lineFields = getOne2manyLineFields(model, n);
          var rows = [];
          tbody.querySelectorAll('tr').forEach(function (tr) {
            var row = {};
            var id = tr.getAttribute('data-o2m-id');
            if (id) row.id = parseInt(id, 10);
            lineFields.forEach(function (lf) {
              var inp = tr.querySelector('[data-o2m-field="' + lf + '"]');
              if (inp) row[lf] = inp.value || (lf === 'date_deadline' ? null : '');
            });
            if (lineFields.length) rows.push(row);
          });
          vals[n] = rows;
        }
        return;
      }
      const m2m = getMany2manyInfo(model, n);
      if (m2m) {
        const tagsDiv = form.querySelector('#m2m-' + n + '[data-widget="many2many_tags"]');
        if (tagsDiv && tagsDiv.dataset.selected) {
          try { vals[n] = JSON.parse(tagsDiv.dataset.selected || '[]'); } catch (e) { vals[n] = []; }
        } else {
          const ids = [];
          form.querySelectorAll('input[name="' + n + '_cb"]:checked').forEach(function (cb) { ids.push(parseInt(cb.value, 10)); });
          vals[n] = ids;
        }
        return;
      }
      if (isBooleanField(model, n)) {
        const cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
        vals[n] = cb ? !!cb.checked : false;
        return;
      }
      if (isBinaryField(model, n) || isImageField(model, n)) {
        const v = byName(n);
        if (v) vals[n] = v;
        return;
      }
      if (isHtmlField(model, n)) {
        vals[n] = byName(n);
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

  function clearFieldErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('field-error'); });
    form.querySelectorAll('.field-error-msg').forEach(function (el) { el.remove(); });
  }

  function showFieldError(form, fname, msg) {
    const wrapper = form.querySelector('[data-fname="' + fname + '"]');
    if (!wrapper) return;
    wrapper.classList.add('field-error');
    const prev = wrapper.querySelector('.field-error-msg');
    if (prev) prev.remove();
    const errEl = document.createElement('span');
    errEl.className = 'field-error-msg';
    errEl.textContent = msg || 'Invalid';
    wrapper.appendChild(errEl);
  }

  function validateRequiredFields(form, model) {
    const fields = getFormFields(model);
    const formVals = getFormVals(form, model);
    const errors = [];
    fields.forEach(function (f) {
      const n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      const meta = getFieldMeta(model, n);
      const required = (meta && meta.required) || n === 'name';
      if (!required) return;
      const v = formVals[n];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
      if (empty) errors.push({ fname: n, msg: (meta && meta.string) ? meta.string + ' is required' : n + ' is required' });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function setupFormDirtyTracking(form) {
    formDirty = false;
    var markDirty = function () { formDirty = true; updateDirtyBanner(); };
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(function (el) {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });
  }

  function updateDirtyBanner() {
    const banner = document.getElementById('form-dirty-banner');
    if (!banner) return;
    banner.style.display = formDirty ? 'block' : 'none';
  }

  function handleSaveError(form, model, err, btn) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
    if ((err.message || '').indexOf('Session expired') >= 0) { window.location.href = '/web/login'; return; }
    showToast(err.message || 'Failed to save', 'error');
    clearFieldErrors(form);
    showFormError(form, err.message || 'Failed to save');
    var msg = (err.message || '').toLowerCase();
    var fields = getFormFields(model || []);
    (fields || []).forEach(function (f) {
      var n = typeof f === 'object' ? f.name : f;
      if (n && msg.indexOf(n.toLowerCase()) >= 0) showFieldError(form, n, err.message || 'Invalid');
    });
  }

  function createRecord(model, route, form) {
    clearFieldErrors(form);
    var validation = validateRequiredFields(form, model);
    if (!validation.valid) {
      validation.errors.forEach(function (e) {
        showFieldError(form, e.fname, e.msg);
      });
      showFormError(form, 'Please fill in all required fields.');
      return;
    }
    const vals = getFormVals(form, model);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'create', [[vals]])
      .then(() => {
        formDirty = false;
        showToast('Record created', 'success');
        window.location.hash = route;
        loadRecords(model, route, currentListState.searchTerm);
      })
      .catch(err => handleSaveError(form, err, btn));
  }

  function updateRecord(model, route, id, form) {
    clearFieldErrors(form);
    var validation = validateRequiredFields(form, model);
    if (!validation.valid) {
      validation.errors.forEach(function (e) {
        showFieldError(form, e.fname, e.msg);
      });
      showFormError(form, 'Please fill in all required fields.');
      return;
    }
    const vals = getFormVals(form, model);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    rpc.callKw(model, 'write', [[parseInt(id, 10)], vals])
      .then(() => {
        formDirty = false;
        showToast('Record saved', 'success');
        window.location.hash = route;
        loadRecords(model, route, currentListState.searchTerm);
      })
      .catch(err => handleSaveError(form, model, err, btn));
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

  function getHashDomainParam() {
    const hash = (window.location.hash || '').slice(1);
    const q = hash.indexOf('?');
    if (q < 0) return null;
    const params = new URLSearchParams(hash.slice(q + 1));
    const d = params.get('domain');
    if (!d) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(d));
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) { return null; }
  }

  function loadRecords(model, route, searchTerm, stageFilter, viewTypeOverride, savedFilterId, offsetOverride, orderOverride, domainOverride) {
    const viewType = viewTypeOverride != null ? viewTypeOverride : getPreferredViewType(route);
    const cols = getListColumns(model);
    const fnames = cols.map(c => typeof c === 'object' ? c.name : c);
    let fields = ['id'].concat(fnames);
    fnames.forEach(function (f) {
      const cf = getMonetaryCurrencyField(model, f);
      if (cf && fields.indexOf(cf) < 0) fields.push(cf);
    });
    const title = getTitle(route);
    if (stageFilter === undefined && currentListState.route === route) stageFilter = currentListState.stageFilter;
    if (savedFilterId === undefined && currentListState.route === route) savedFilterId = currentListState.savedFilterId;
    const offset = offsetOverride != null ? offsetOverride : (currentListState.route === route ? (currentListState.offset || 0) : 0);
    const limit = currentListState.limit || 80;
    const order = orderOverride != null ? orderOverride : (currentListState.route === route ? currentListState.order : null);
    const action = getActionForRoute(route);
    const actionDomain = (domainOverride && domainOverride.length) ? domainOverride : (action ? parseActionDomain(action.domain || '') : []);
    const domainOverrideProvided = !!(domainOverride && domainOverride.length);
    const prevCal = (viewType === 'calendar' && currentListState.route === route) ? { calendarYear: currentListState.calendarYear, calendarMonth: currentListState.calendarMonth } : {};
    const prevFilters = (currentListState.route === route) ? { activeSearchFilters: currentListState.activeSearchFilters || [], groupBy: currentListState.groupBy } : {};
    currentListState = Object.assign({ model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: viewType, savedFilterId: savedFilterId || null, offset: offset, limit: limit, order: order, totalCount: 0, activeSearchFilters: [], groupBy: null }, prevCal, prevFilters);
    main.innerHTML = '<h2>' + title + '</h2><p>Loading...</p>';
    getSavedFilters(model).then(function (savedFilters) {
      let domain = actionDomain.slice();
      const savedFilter = savedFilterId ? savedFilters.find(function (f) { return f.id == savedFilterId; }) : null;
      if (savedFilter && savedFilter.domain && savedFilter.domain.length) {
        domain = domain.concat(savedFilter.domain);
      } else {
        if (!domainOverrideProvided) {
          const searchDom = buildSearchDomain(model, searchTerm && searchTerm.trim() ? searchTerm.trim() : '');
          if (searchDom.length) domain = domain.concat(searchDom);
        }
        if (model === 'crm.lead' && stageFilter) domain = domain.concat([['stage_id', '=', stageFilter]]);
      }
      const searchView = viewsSvc && viewsSvc.getView(model, 'search');
      const filters = (searchView && searchView.filters) || [];
      (currentListState.activeSearchFilters || []).forEach(function (fname) {
        const f = filters.find(function (x) { return x.name === fname && x.domain; });
        if (f && f.domain) {
          const fd = parseFilterDomain(f.domain);
          if (fd.length) domain = domain.concat(fd);
        }
      });
      if (viewType === 'graph' && viewsSvc && viewsSvc.getView(model, 'graph')) {
        loadGraphData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      if (viewType === 'pivot' && viewsSvc && viewsSvc.getView(model, 'pivot')) {
        loadPivotData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      if (viewType === 'activity' && model === 'crm.lead') {
        loadActivityData(model, route, domain, searchTerm, savedFilters);
        return Promise.resolve();
      }
      const searchReadKw = { fields: fields, offset: offset, limit: limit };
      const effectiveOrder = order || (currentListState.groupBy ? currentListState.groupBy : null);
      if (effectiveOrder) searchReadKw.order = effectiveOrder;
      const searchReadPromise = rpc.callKw(model, 'search_read', [domain], searchReadKw);
      const searchCountPromise = rpc.callKw(model, 'search_count', [domain], {}).catch(function () { return null; });
      return Promise.all([searchCountPromise, searchReadPromise]).then(function (results) {
        const totalCount = results[0] != null ? results[0] : (results[1].length + offset);
        const records = results[1];
        currentListState.totalCount = totalCount;
        if (viewType === 'kanban' && model === 'crm.lead' && window.ViewRenderers && window.ViewRenderers.kanban) {
          renderKanban(model, route, records, searchTerm);
        } else if (viewType === 'calendar' && model === 'crm.lead') {
          renderCalendar(model, route, records, searchTerm);
        } else {
          renderList(model, route, records, searchTerm, totalCount, offset, limit, savedFilters);
        }
      });
    }).catch(err => {
      main.innerHTML = '<h2>' + title + '</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load') + '</p>';
    });
  }

  function loadActivityData(model, route, domain, searchTerm, savedFiltersList) {
    const sessionSvc = window.Services && window.Services.session;
    if (!sessionSvc) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Session required for activity view.</p>';
      return;
    }
    sessionSvc.getSessionInfo().then(function (info) {
      if (!info || !info.uid) {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Please log in.</p>';
        return;
      }
      const actDomain = [['res_model', '=', model], ['user_id', '=', info.uid]];
      if (domain && domain.length) {
        const leadIds = domain.filter(function (d) { return d[0] === 'id' && d[1] === 'in'; });
        if (leadIds.length && leadIds[0][2] && leadIds[0][2].length) {
          actDomain.push(['res_id', 'in', leadIds[0][2]]);
        }
      }
      return rpc.callKw('mail.activity', 'search_read', [actDomain], {
        fields: ['id', 'res_model', 'res_id', 'summary', 'date_deadline', 'state', 'activity_type_id'],
        order: 'date_deadline',
        limit: 100
      }).then(function (activities) {
        renderActivity(model, route, activities || [], searchTerm, savedFiltersList || []);
      });
    }).catch(function () {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error" style="color:#c00">Failed to load activities.</p>';
    });
  }

  function renderActivity(model, route, activities, searchTerm, savedFiltersList) {
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = 'activity';
    actionStack = [{ label: title, hash: route }];
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
    html += renderViewSwitcher(route, currentView);
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    const today = new Date().toISOString().slice(0, 10);
    const overdue = [];
    const todayList = [];
    const planned = [];
    (activities || []).forEach(function (a) {
      const d = a.date_deadline || '';
      if (d && d < today) overdue.push(a);
      else if (d === today) todayList.push(a);
      else planned.push(a);
    });
    function renderGroup(label, items, color) {
      if (!items.length) return '';
      let h = '<div class="activity-group" style="margin-bottom:var(--space-lg)"><h3 style="font-size:1rem;margin:0 0 0.5rem;color:' + (color || '#333') + '">' + label + ' (' + items.length + ')</h3><ul style="list-style:none;padding:0;margin:0">';
      items.forEach(function (a) {
        const summary = (a.summary || 'Activity').replace(/</g, '&lt;');
        const dateStr = a.date_deadline || '';
        h += '<li style="padding:0.5rem;border-bottom:1px solid #eee"><a href="#' + route + '/edit/' + a.res_id + '" style="text-decoration:none;color:inherit">' + summary + (dateStr ? ' <span style="color:#666;font-size:0.9rem">' + dateStr + '</span>' : '') + '</a></li>';
      });
      h += '</ul></div>';
      return h;
    }
    html += renderGroup('Overdue', overdue, '#c00');
    html += renderGroup('Today', todayList, '#1a1a2e');
    html += renderGroup('Planned', planned, '#666');
    if (!overdue.length && !todayList.length && !planned.length) {
      html += '<p style="color:var(--text-muted,#666)">No activities.</p>';
    }
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'activity' };
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btn = document.getElementById('btn-add');
    if (btn) btn.onclick = function () { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), null, 'activity', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
  }

  function loadGraphData(model, route, domain, searchTerm, savedFiltersList) {
    const graphView = viewsSvc && viewsSvc.getView(model, 'graph');
    if (!graphView || !graphView.fields || !graphView.fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>No graph view configured.</p>';
      return;
    }
    const rowFields = (graphView.fields || []).filter(function (f) { return f.role === 'row'; });
    const measureFields = (graphView.fields || []).filter(function (f) { return f.role === 'measure'; });
    const groupby = rowFields.map(function (f) { return f.name; });
    const fields = measureFields.map(function (f) { return f.name; });
    if (!groupby.length || !fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Graph view needs row and measure fields.</p>';
      return;
    }
    const rowField = rowFields[0];
    const comodel = rowField.comodel || null;
    let labelMap = {};
    rpc.callKw(model, 'read_group', [domain], { fields: fields, groupby: groupby })
      .then(function (rows) {
        const ids = (rows || []).map(function (r) { return r[groupby[0]]; }).filter(function (id) { return id; });
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
        const labels = (rows || []).map(function (r) {
          const v = r[groupby[0]];
          return (comodel && labelMap && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
        });
        const groupLabels = {};
        (rows || []).forEach(function (r, i) {
          const v = r[groupby[0]];
          if (v != null) groupLabels[v] = labels[i];
        });
        renderGraph(model, route, graphView, rows, groupby[0], fields, groupLabels, searchTerm, savedFiltersList);
      })
      .catch(function (err) {
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load graph') + '</p>';
      });
  }

  function renderGraph(model, route, graphView, rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const currentView = 'graph';
    actionStack = [{ label: title, hash: route }];
    let graphType = (graphView && graphView.graph_type) || 'bar';
    const labels = (rows || []).map(function (r) {
      const v = r[groupbyField];
      return (labelMap && v != null && labelMap[v]) ? labelMap[v] : (v != null ? String(v) : '');
    });
    const datasets = measureFields.map(function (m, idx) {
      const colors = ['rgba(26,26,46,0.8)', 'rgba(70,130,180,0.8)', 'rgba(34,139,34,0.8)', 'rgba(218,165,32,0.8)'];
      return {
        label: m.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
        data: (rows || []).map(function (r) { return r[m] != null ? Number(r[m]) : 0; }),
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.8', '1'),
        borderWidth: 1
      };
    });
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
    html += renderViewSwitcher(route, currentView);
    html += '<span class="graph-type-switcher" style="display:inline-flex;gap:2px;margin-right:0.5rem">';
    ['bar', 'line', 'pie'].forEach(function (t) {
      const active = t === graphType;
      html += '<button type="button" class="btn-graph-type' + (active ? ' active' : '') + '" data-type="' + t + '" style="padding:0.35rem 0.6rem;border:1px solid #ddd;background:' + (active ? '#1a1a2e;color:white;border-color:#1a1a2e' : '#fff;color:#333') + ';border-radius:4px;cursor:pointer;font-size:0.9rem">' + (t.charAt(0).toUpperCase() + t.slice(1)) + '</button>';
    });
    html += '</span>';
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    html += '<div class="o-graph-container" style="position:relative;width:100%;max-width:800px;height:400px;margin:var(--space-md) 0;padding:var(--space-md)">';
    html += '<canvas id="graph-canvas"></canvas>';
    html += '</div>';
    main.innerHTML = html;
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'graph' };
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    main.querySelectorAll('.btn-graph-type').forEach(function (btn) {
      btn.onclick = function () {
        graphType = btn.dataset.type;
        renderGraph(model, route, Object.assign({}, graphView, { graph_type: graphType }), rows, groupbyField, measureFields, labelMap, searchTerm, savedFiltersList);
      };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const filterEl = document.getElementById('list-stage-filter');
        const val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
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
              loadRecords(model, route, searchInput.value.trim(), val, 'graph', null, 0, null);
            };
          });
      }
    }
    const ctx = document.getElementById('graph-canvas');
    if (!ctx || !window.Chart) {
      main.querySelector('.o-graph-container').innerHTML = '<p>Chart.js not loaded. Refresh the page.</p>';
      return;
    }
    const chartConfig = {
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

  function loadPivotData(model, route, domain, searchTerm, savedFiltersList) {
    const pivotView = viewsSvc && viewsSvc.getView(model, 'pivot');
    if (!pivotView || !pivotView.fields || !pivotView.fields.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>No pivot view configured.</p>';
      return;
    }
    const rowFields = (pivotView.fields || []).filter(function (f) { return f.role === 'row'; });
    const colFields = (pivotView.fields || []).filter(function (f) { return f.role === 'col'; });
    const measureFields = (pivotView.fields || []).filter(function (f) { return f.role === 'measure'; });
    const rowNames = rowFields.map(function (f) { return f.name; });
    const colNames = colFields.map(function (f) { return f.name; });
    const measures = measureFields.map(function (f) { return f.name; });
    if (!rowNames.length || !colNames.length || !measures.length) {
      main.innerHTML = '<h2>' + getTitle(route) + '</h2><p>Pivot view needs row, col, and measure fields.</p>';
      return;
    }
    const groupby = rowNames.concat(colNames);
    rpc.callKw(model, 'read_group', [domain], { fields: measures, groupby: groupby, lazy: false })
      .then(function (rows) {
        const rowComodel = rowFields[0] && rowFields[0].comodel;
        const colComodel = colFields[0] && colFields[0].comodel;
        const rowIds = [];
        const colIds = [];
        (rows || []).forEach(function (r) {
          const rv = r[rowNames[0]];
          const cv = r[colNames[0]];
          if (rv != null && rowIds.indexOf(rv) < 0) rowIds.push(rv);
          if (cv != null && colIds.indexOf(cv) < 0) colIds.push(cv);
        });
        let rowLabelMap = {};
        let colLabelMap = {};
        const promises = [];
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
        main.innerHTML = '<h2>' + getTitle(route) + '</h2><p class="error" style="color:#c00">' + (err.message || 'Failed to load pivot') + '</p>';
      });
  }

  function renderPivot(model, route, pivotView, rows, rowNames, colNames, measures, rowLabelMap, colLabelMap, searchTerm, savedFiltersList) {
    savedFiltersList = savedFiltersList || [];
    const title = getTitle(route);
    const stageFilter = currentListState.route === route ? currentListState.stageFilter : null;
    const rowField = rowNames[0];
    const colField = colNames[0];
    const measureField = measures[0];
    rowLabelMap = rowLabelMap || {};
    colLabelMap = colLabelMap || {};
    const rowVals = [];
    const colVals = [];
    const matrix = {};
    (rows || []).forEach(function (r) {
      const rv = r[rowField];
      const cv = r[colField];
      const val = r[measureField] != null ? Number(r[measureField]) : 0;
      if (rv != null && rowVals.indexOf(rv) < 0) rowVals.push(rv);
      if (cv != null && colVals.indexOf(cv) < 0) colVals.push(cv);
      const key = String(rv) + '_' + String(cv);
      matrix[key] = val;
    });
    const rowLabels = rowVals.map(function (v) { return rowLabelMap[v] || (v != null ? String(v) : ''); });
    const colLabels = colVals.map(function (v) { return colLabelMap[v] || (v != null ? String(v) : ''); });
    const rowTotals = {};
    const colTotals = {};
    rowVals.forEach(function (rv) { rowTotals[rv] = 0; });
    colVals.forEach(function (cv) { colTotals[cv] = 0; });
    rowVals.forEach(function (rv) {
      colVals.forEach(function (cv) {
        const key = String(rv) + '_' + String(cv);
        const v = matrix[key] || 0;
        rowTotals[rv] += v;
        colTotals[cv] += v;
      });
    });
    let grandTotal = 0;
    Object.keys(matrix).forEach(function (k) { grandTotal += matrix[k]; });
    actionStack = [{ label: title, hash: route }];
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', stageFilter: stageFilter, viewType: 'pivot' };
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
    html += renderViewSwitcher(route, 'pivot');
    html += '<button type="button" id="btn-pivot-flip" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Flip axes</button>';
    html += '<button type="button" id="btn-pivot-download" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Download CSV</button>';
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    if (model === 'crm.lead') {
      html += '<select id="list-stage-filter" style="padding:0.5rem;border:1px solid #ddd;border-radius:4px"><option value="">All stages</option></select>';
    }
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    html += '<div class="o-pivot-container o-card-gradient" style="overflow-x:auto;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-md);margin:var(--space-md) 0">';
    html += '<table style="width:100%;border-collapse:collapse;min-width:400px"><thead><tr><th style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:left;background:var(--color-bg)"></th>';
    colLabels.forEach(function (l) {
      html += '<th style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right;background:var(--color-bg)">' + (l || '').replace(/</g, '&lt;') + '</th>';
    });
    html += '<th style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right;background:var(--color-bg);font-weight:600">Total</th></tr></thead><tbody>';
    rowVals.forEach(function (rv, ri) {
      html += '<tr><td style="padding:var(--space-sm);border:1px solid var(--border-color);font-weight:500">' + (rowLabels[ri] || '').replace(/</g, '&lt;') + '</td>';
      colVals.forEach(function (cv) {
        const key = rv + '_' + cv;
        const val = matrix[key] || 0;
        html += '<td style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right">' + (typeof val === 'number' ? val.toLocaleString() : val) + '</td>';
      });
      html += '<td style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right;font-weight:600">' + (rowTotals[rv] || 0).toLocaleString() + '</td></tr>';
    });
    html += '<tr><td style="padding:var(--space-sm);border:1px solid var(--border-color);font-weight:600;background:var(--color-bg)">Total</td>';
    colVals.forEach(function (cv) {
      html += '<td style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right;font-weight:600;background:var(--color-bg)">' + (colTotals[cv] || 0).toLocaleString() + '</td>';
    });
    html += '<td style="padding:var(--space-sm);border:1px solid var(--border-color);text-align:right;font-weight:600;background:var(--color-bg)">' + grandTotal.toLocaleString() + '</td></tr>';
    html += '</tbody></table></div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const btnFlip = document.getElementById('btn-pivot-flip');
    if (btnFlip) {
      btnFlip.onclick = function () {
        renderPivot(model, route, pivotView, rows, colNames, rowNames, measures, colLabelMap, rowLabelMap, searchTerm, savedFiltersList);
      };
    }
    const btnDownload = document.getElementById('btn-pivot-download');
    if (btnDownload) {
      btnDownload.onclick = function () {
        let csv = ',' + colLabels.map(function (l) { return '"' + (l || '').replace(/"/g, '""') + '"'; }).join(',') + ',"Total"\n';
        rowVals.forEach(function (rv, ri) {
          csv += '"' + (rowLabels[ri] || '').replace(/"/g, '""') + '"';
          colVals.forEach(function (cv) {
            const key = rv + '_' + cv;
            csv += ',' + (matrix[key] || 0);
          });
          csv += ',' + (rowTotals[rv] || 0) + '\n';
        });
        csv += '"Total"';
        colVals.forEach(function (cv) { csv += ',' + (colTotals[cv] || 0); });
        csv += ',' + grandTotal + '\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pivot_' + (route || 'data') + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () {
        const filterEl = document.getElementById('list-stage-filter');
        const val = model === 'crm.lead' && filterEl && filterEl.value ? parseInt(filterEl.value, 10) : null;
        loadRecords(model, route, searchInput.value.trim(), val, 'pivot', null, 0, null);
      };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
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
              loadRecords(model, route, searchInput ? searchInput.value.trim() : '', val, 'pivot', null, 0, null);
            };
          });
      }
    }
  }

  function renderCalendar(model, route, records, searchTerm) {
    const calendarView = viewsSvc && viewsSvc.getView(model, 'calendar');
    const dateField = (calendarView && calendarView.date_start) || 'date_deadline';
    const stringField = (calendarView && calendarView.string) || 'name';
    const title = getTitle(route);
    actionStack = [{ label: title, hash: route }];
    let calYear = (currentListState.route === route && currentListState.calendarYear) || new Date().getFullYear();
    let calMonth = (currentListState.route === route && currentListState.calendarMonth) || (new Date().getMonth() + 1);
    currentListState = { model: model, route: route, searchTerm: searchTerm || '', viewType: 'calendar', calendarYear: calYear, calendarMonth: calMonth };
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const recordsByDate = {};
    (records || []).forEach(function (r) {
      const d = r[dateField];
      if (!d) return;
      const dateStr = typeof d === 'string' ? d.slice(0, 10) : (d && d.toISOString ? d.toISOString().slice(0, 10) : '');
      if (!dateStr) return;
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '<h2>' + title + '</h2>';
    html += '<p style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:var(--space-md)">';
    html += renderViewSwitcher(route, 'calendar');
    html += '<button type="button" id="cal-prev" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Prev</button>';
    html += '<span id="cal-title" style="min-width:140px;font-weight:600">' + firstDay.toLocaleString('default', { month: 'long', year: 'numeric' }) + '</span>';
    html += '<button type="button" id="cal-next" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Next</button>';
    html += '<button type="button" id="cal-today" style="padding:0.35rem 0.6rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:#fff">Today</button>';
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + (searchTerm || '').replace(/"/g, '&quot;') + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Add lead</button></p>';
    html += '<div class="o-calendar" style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border-color);border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden">';
    dayNames.forEach(function (dn) {
      html += '<div style="padding:var(--space-sm);background:var(--color-bg);font-weight:600;font-size:0.85rem">' + dn + '</div>';
    });
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (var i = 0; i < totalCells; i++) {
      const dayNum = i - startPad + 1;
      const isEmpty = dayNum < 1 || dayNum > daysInMonth;
      const dateStr = isEmpty ? '' : calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
      const dayRecs = dateStr ? (recordsByDate[dateStr] || []) : [];
      let cellContent = isEmpty ? '' : '<span style="font-size:0.9rem;color:var(--text-muted)">' + dayNum + '</span>';
      dayRecs.forEach(function (rec) {
        const label = (rec[stringField] || 'Untitled').replace(/</g, '&lt;').slice(0, 30);
        cellContent += '<div style="margin-top:0.25rem"><a href="#' + route + '/edit/' + (rec.id || '') + '" style="display:block;padding:0.2rem 0.4rem;background:var(--color-primary);color:white;border-radius:4px;font-size:0.8rem;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + label + '</a></div>';
      });
      html += '<div style="min-height:80px;padding:var(--space-sm);background:#fff">' + cellContent + '</div>';
    }
    html += '</div>';
    main.innerHTML = html;
    main.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.onclick = function () { const v = btn.dataset.view; if (v) setViewAndReload(route, v); };
    });
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) btnAdd.onclick = function () { window.location.hash = route + '/new'; };
    const doReload = function () {
      const si = document.getElementById('list-search');
      loadRecords(model, route, si ? si.value.trim() : '', null, 'calendar', null, 0, null);
    };
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const todayBtn = document.getElementById('cal-today');
    if (prevBtn) prevBtn.onclick = function () {
      calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; }
      currentListState.calendarYear = calYear; currentListState.calendarMonth = calMonth;
      doReload();
    };
    if (nextBtn) nextBtn.onclick = function () {
      calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; }
      currentListState.calendarYear = calYear; currentListState.calendarMonth = calMonth;
      doReload();
    };
    if (todayBtn) todayBtn.onclick = function () {
      const now = new Date();
      currentListState.calendarYear = now.getFullYear();
      currentListState.calendarMonth = now.getMonth() + 1;
      doReload();
    };
    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('list-search');
    if (btnSearch && searchInput) {
      const doSearch = function () { loadRecords(model, route, searchInput.value.trim(), null, 'calendar', null, 0, null); };
      btnSearch.onclick = doSearch;
      searchInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } };
    }
  }

  function renderKanban(model, route, records, searchTerm) {
    const title = getTitle(route);
    actionStack = [{ label: title, hash: route }];
    const addLabel = route === 'leads' ? 'Add lead' : route === 'orders' ? 'Add order' : route === 'products' ? 'Add product' : route === 'settings/users' ? 'Add user' : 'Add';
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
                .catch(err => showToast(err.message || 'Failed to update stage', 'error'));
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

  function isFormRoute(hash) {
    const dataRoutes = 'contacts|leads|attachments|settings\\/users';
    return new RegExp('^(' + dataRoutes + ')\\/edit\\/\\d+$').test(hash) || new RegExp('^(' + dataRoutes + ')\\/new$').test(hash);
  }

  function route() {
    const hash = (window.location.hash || '#home').slice(1);
    const base = hash.split('?')[0];
    if (formDirty && isFormRoute(lastHash) && hash !== lastHash) {
      if (!confirm('Leave without saving?')) {
        window.location.hash = lastHash;
        return;
      }
      formDirty = false;
    }
    lastHash = hash;
    const dataRoutes = 'contacts|leads|orders|products|attachments|settings/users';
    const editMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/edit\\/(\\d+)$'));
    const newMatch = hash.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')\\/new$'));
    const listMatch = base.match(new RegExp('^(' + dataRoutes.replace(/\//g, '\\/') + ')$'));
    const settingsApiKeysMatch = hash.match(/^settings\/apikeys$/);
    const settingsTotpMatch = hash.match(/^settings\/totp$/);
    const settingsDashboardMatch = hash.match(/^settings\/dashboard-widgets$/);
    const settingsIndexMatch = hash.match(/^settings\/?$/);

    if (settingsApiKeysMatch) {
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
      if (model) loadRecords(model, route, currentListState.route === route ? currentListState.searchTerm : '', undefined, undefined, undefined, undefined, undefined, getHashDomainParam());
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

  (function init() {
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
  })();
})();
