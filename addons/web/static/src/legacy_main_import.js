/**
 * Legacy main: CSV/XLSX import modal (split from chrome block, Phase 804).
 * Loaded before legacy_main_chrome_block.js; ctx wired via install(ctx).
 */
(function () {
  var _ctx = {};

  function install(ctx) {
    _ctx = ctx || {};
  }

function showImportModal(model, route) {
  const cols = _ctx.getListColumns(model);
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
          if (data.error) { _ctx.showToast(data.error, 'error'); return; }
          csvHeaders = data.headers || [];
          csvRows = data.rows || [];
          renderImportPreview();
        })
        .catch(function () { _ctx.showToast('Preview failed', 'error'); });
    } else {
      const r = new FileReader();
      r.onload = function () {
        const parsed = _ctx.parseCSV(r.result || '');
        if (!parsed.length) { _ctx.showToast('No rows in CSV', 'error'); return; }
        csvHeaders = parsed[0];
        csvRows = parsed.slice(1);
        renderImportPreview();
      };
      r.readAsText(f);
    }
    importFile = f;
  };
  function renderImportPreview() {
    if (_ctx.ImportCore && typeof _ctx.ImportCore.renderPreview === "function") {
      var previewHtml = _ctx.ImportCore.renderPreview(csvHeaders || [], csvRows || [], modelFields || []);
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
    if (!fields.length) { _ctx.showToast('Map at least one column', 'error'); return; }
    const mapping = {};
    Object.keys(csvIdxToField).forEach(function (k) { mapping[k] = csvIdxToField[k]; });
    if (!importFile) { _ctx.showToast('Select a file first', 'error'); return; }
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
      .catch(function (err) { _ctx.showToast(err.message || 'Import failed', 'error'); });
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
      _ctx.loadRecords(model, route, (_ctx.getCurrentListState ? _ctx.getCurrentListState().searchTerm : ''));
    };
    if (!res.errors || !res.errors.length) {
      _ctx.showToast('Imported ' + (res.created || 0) + ' created, ' + (res.updated || 0) + ' updated', 'success');
      setTimeout(function () {
        closeModal();
        _ctx.loadRecords(model, route, (_ctx.getCurrentListState ? _ctx.getCurrentListState().searchTerm : ''));
      }, 1500);
    }
  }
  document.getElementById('import-cancel-btn').onclick = closeModal;
}

  window.__ERP_LEGACY_MAIN_IMPORT = {
    install: install,
    showImportModal: showImportModal,
  };
})();
