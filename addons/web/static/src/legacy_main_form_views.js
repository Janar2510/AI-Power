/**
 * @deprecated Track O3 — This module is scheduled for retirement once the OWL
 * FormController (Track J3) is fully wired via ActionContainer (Track O2).
 * Do NOT add new functionality here. Migrate logic to
 * app/views/form/form_controller.js and app/views/fields/core_fields.js.
 *
 * Legacy web.assets_web: form field helpers + form view rendering + CRUD.
 * Loaded before main.js; sets window.__ERP_FORM_VIEWS (Phase 1.245 Track D1).
 */
(function () {
  'use strict';
  var FV = {};
  var _ctx = null;

  FV.install = function (ctx) {
    _ctx = ctx;
  };

  /* ──────────────────────────────────────────────
   * 1. getViewFieldDef
   * ────────────────────────────────────────────── */
  function getViewFieldDef(model, fname) {
    if (!_ctx.viewsSvc || !model || !fname) return null;
    var formV = _ctx.viewsSvc.getView(model, 'form');
    if (formV && formV.fields) {
      var f = formV.fields.find(function (x) { var n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (f && typeof f === 'object') return f;
    }
    var listV = _ctx.viewsSvc.getView(model, 'list');
    if (listV && listV.columns) {
      var c = listV.columns.find(function (x) { var n = typeof x === 'object' ? x.name : x; return n === fname; });
      if (c && typeof c === 'object') return c;
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 2. getFieldMeta
   * ────────────────────────────────────────────── */
  function getFieldMeta(model, fname) {
    return _ctx.viewsSvc ? _ctx.viewsSvc.getFieldMeta(model, fname) : null;
  }

  /* ──────────────────────────────────────────────
   * 3. getMany2oneComodel
   * ────────────────────────────────────────────── */
  function getMany2oneComodel(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.comodel) return def.comodel;
    var meta = getFieldMeta(model, fname);
    if (meta && meta.comodel) return meta.comodel;
    return null;
  }

  /* ──────────────────────────────────────────────
   * 4. getMany2oneDomain
   * ────────────────────────────────────────────── */
  function getMany2oneDomain(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.domain_dep) {
      var dep = def.domain_dep;
      return { depField: dep, domain: [[dep, '=', null]] };
    }
    if (model === 'res.partner' && fname === 'state_id') return { depField: 'country_id', domain: [['country_id', '=', null]] };
    return null;
  }

  /* ──────────────────────────────────────────────
   * 5. getSelectionOptions
   * ────────────────────────────────────────────── */
  function getSelectionOptions(model, fname) {
    var meta = getFieldMeta(model, fname);
    if (meta && meta.selection && meta.selection.length) return meta.selection;
    return null;
  }

  /* ──────────────────────────────────────────────
   * 6. isBooleanField
   * ────────────────────────────────────────────── */
  function isBooleanField(model, fname) {
    var meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'boolean';
    return false;
  }

  /* ──────────────────────────────────────────────
   * 7. isMonetaryField
   * ────────────────────────────────────────────── */
  function isMonetaryField(model, fname) {
    var meta = getFieldMeta(model, fname);
    return meta && meta.type === 'monetary';
  }

  /* ──────────────────────────────────────────────
   * 8. getMonetaryCurrencyField
   * ────────────────────────────────────────────── */
  function getMonetaryCurrencyField(model, fname) {
    var meta = getFieldMeta(model, fname);
    return (meta && meta.type === 'monetary' && meta.currency_field) ? meta.currency_field : null;
  }

  /* ──────────────────────────────────────────────
   * 9. pad2
   * ────────────────────────────────────────────── */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* ──────────────────────────────────────────────
   * 10. serverValueToDateInput
   * ────────────────────────────────────────────── */
  function serverValueToDateInput(val) {
    if (val == null || val === false || val === '') return '';
    var s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var d = new Date(s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* ──────────────────────────────────────────────
   * 11. serverValueToDatetimeLocal
   * ────────────────────────────────────────────── */
  function serverValueToDatetimeLocal(val) {
    if (val == null || val === false || val === '') return '';
    var s = String(val);
    var d = new Date(s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* ──────────────────────────────────────────────
   * 12. dateInputToServer
   * ────────────────────────────────────────────── */
  function dateInputToServer(val) {
    if (!val || !String(val).trim()) return false;
    return String(val).trim();
  }

  /* ──────────────────────────────────────────────
   * 13. datetimeLocalToServer
   * ────────────────────────────────────────────── */
  function datetimeLocalToServer(val) {
    if (!val || !String(val).trim()) return false;
    var d = new Date(val);
    if (isNaN(d.getTime())) return false;
    return d.toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  }

  /* ──────────────────────────────────────────────
   * 14. confirmModal
   * ────────────────────────────────────────────── */
  function confirmModal(opts) {
    // Track P3: prefer OWL DialogService → UIComponents.ConfirmDialog → native confirm
    var DS = window.AppCore && window.AppCore.DialogService;
    if (DS && typeof DS.confirm === 'function') {
      return DS.confirm(opts || {});
    }
    if (window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.confirm === 'function') {
      return window.UIComponents.ConfirmDialog.confirm(opts || {});
    }
    var o = opts || {};
    return Promise.resolve(window.confirm((o.title ? o.title + '\n\n' : '') + (o.message || o.body || 'Are you sure?')));
  }

  /* ──────────────────────────────────────────────
   * 15. isBinaryField
   * ────────────────────────────────────────────── */
  function isBinaryField(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.widget === 'binary') return true;
    var meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'binary') return true;
    return false;
  }

  /* ──────────────────────────────────────────────
   * 16. isHtmlField
   * ────────────────────────────────────────────── */
  function isHtmlField(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.widget === 'html') return true;
    var meta = getFieldMeta(model, fname);
    return meta && meta.type === 'html';
  }

  /* ──────────────────────────────────────────────
   * 17. isImageField
   * ────────────────────────────────────────────── */
  function isImageField(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.widget === 'image') return true;
    var meta = getFieldMeta(model, fname);
    return meta && meta.type === 'image';
  }

  /* ──────────────────────────────────────────────
   * 18. getSelectionLabel
   * ────────────────────────────────────────────── */
  function getSelectionLabel(model, fname, value) {
    var opts = getSelectionOptions(model, fname);
    if (!opts || value == null || value === '') return value;
    var pair = opts.find(function (o) { return o[0] === value || String(o[0]) === String(value); });
    return pair ? pair[1] : value;
  }

  /* ──────────────────────────────────────────────
   * 19. getOne2manyInfo
   * ────────────────────────────────────────────── */
  function getOne2manyInfo(model, fname) {
    var meta = getFieldMeta(model, fname);
    if (meta && meta.type === 'one2many' && meta.comodel) return { comodel: meta.comodel, inverse: meta.inverse_name || '' };
    return null;
  }

  /* ──────────────────────────────────────────────
   * 20. getOne2manyFieldInputType
   * ────────────────────────────────────────────── */
  function getOne2manyFieldInputType(model, fname, lf) {
    if (lf === 'date_deadline') return 'date';
    if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0) return 'number';
    return 'text';
  }

  /* ──────────────────────────────────────────────
   * 21. renderOne2manyRow
   * ────────────────────────────────────────────── */
  function renderOne2manyRow(model, fname, lineFields, rowData, rowIndex) {
    var id = rowData && rowData.id;
    var dataAttrs = id ? ' data-o2m-id="' + id + '"' : ' data-o2m-new="1"';
    var cells = lineFields.map(function (lf) {
      var val = (rowData && rowData[lf]) || '';
      var inpType = getOne2manyFieldInputType(model, fname, lf);
      var step = (lf === 'price_unit' || lf === 'price_subtotal' || lf === 'unit_amount' || lf === 'total_amount') ? '0.01' : '1';
      var readonly = (lf === 'price_subtotal' || lf === 'total_amount') ? ' readonly data-o2m-computed="1"' : '';
      return '<td style="padding:0.25rem"><input type="' + inpType + '" data-o2m-field="' + lf + '" value="' + (val || '').replace(/"/g, '&quot;') + '" step="' + step + '"' + readonly + ' style="width:100%;padding:0.25rem;font-size:0.9rem"></td>';
    }).join('');
    return '<tr' + dataAttrs + '>' + cells + '<td style="padding:0.25rem"><button type="button" class="o2m-delete-row" style="padding:0.2rem 0.4rem;font-size:0.8rem;cursor:pointer;color:#c00">Delete</button></td></tr>';
  }

  /* ──────────────────────────────────────────────
   * 22. setupOne2manyAddButtons
   * ────────────────────────────────────────────── */
  function setupOne2manyAddButtons(form, model) {
    form.querySelectorAll('[id^="o2m-add-"]').forEach(function (btn) {
      var fname = btn.id.replace('o2m-add-', '');
      var o2m = getOne2manyInfo(model, fname);
      if (!o2m) return;
      var lineFields = getOne2manyLineFields(model, fname);
      var tbody = form.querySelector('#o2m-tbody-' + fname);
      if (!tbody) return;
      btn.onclick = function () {
        tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(model, fname, lineFields, null, 0));
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

  /* ──────────────────────────────────────────────
   * 23. setupOne2manyComputedFields
   * ────────────────────────────────────────────── */
  function setupOne2manyComputedFields(form, model) {
    var o2mProductQty = { 'sale.order': { fname: 'order_line', qty: 'product_uom_qty', price: 'price_unit', subtotal: 'price_subtotal' }, 'hr.expense.sheet': { fname: 'expense_line_ids', qty: 'quantity', price: 'unit_amount', subtotal: 'total_amount' } };
    var cfg = o2mProductQty[model];
    if (!cfg) return;
    var tbody = form.querySelector('#o2m-tbody-' + cfg.fname);
    if (!tbody) return;
    var updateSubtotal = function (tr) {
      var qtyInp = tr.querySelector('[data-o2m-field="' + cfg.qty + '"]');
      var priceInp = tr.querySelector('[data-o2m-field="' + cfg.price + '"]');
      var subInp = tr.querySelector('[data-o2m-field="' + cfg.subtotal + '"]');
      if (!qtyInp || !priceInp || !subInp) return;
      var q = parseFloat(qtyInp.value) || 0;
      var p = parseFloat(priceInp.value) || 0;
      subInp.value = (q * p).toFixed(2);
    };
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var qtyInp = tr.querySelector('[data-o2m-field="' + cfg.qty + '"]');
      var priceInp = tr.querySelector('[data-o2m-field="' + cfg.price + '"]');
      if (qtyInp) qtyInp.oninput = function () { updateSubtotal(tr); };
      if (priceInp) priceInp.oninput = function () { updateSubtotal(tr); };
    });
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.tagName === 'TR') {
            var qtyInp = node.querySelector('[data-o2m-field="' + cfg.qty + '"]');
            var priceInp = node.querySelector('[data-o2m-field="' + cfg.price + '"]');
            if (qtyInp) qtyInp.oninput = function () { updateSubtotal(node); };
            if (priceInp) priceInp.oninput = function () { updateSubtotal(node); };
          }
        });
      });
    });
    observer.observe(tbody, { childList: true });
  }

  /* ──────────────────────────────────────────────
   * 24. loadChatter
   * ────────────────────────────────────────────── */
  function loadChatter(model, recordId, messageIds) {
    var container = document.querySelector('.chatter-messages-list');
    if (!container) return;
    var CS = window.AppCore && window.AppCore.ChatterStrip;
    var useStrip = CS && typeof CS.appendChatterRows === 'function' && typeof CS.setChatterError === 'function';
    container.innerHTML = '';
    if (!messageIds || !messageIds.length) {
      if (useStrip) {
        CS.appendChatterRows(container, [], {});
      } else {
        container.innerHTML = '<p class="o-chatter-empty">No messages yet.</p>';
      }
      return;
    }
    _ctx.rpc.callKw('mail.message', 'search_read', [[['id', 'in', messageIds]]], {
      fields: ['id', 'body', 'author_id', 'date', 'attachment_ids'],
      order: 'id asc'
    }).then(function (rows) {
      var authorIds = [];
      rows.forEach(function (r) { if (r.author_id) authorIds.push(r.author_id); });
      var uniq = authorIds.filter(function (x, i, a) { return a.indexOf(x) === i; });
      var nameMap = {};
      var renderRows = function () {
        if (useStrip) {
          CS.appendChatterRows(container, rows, nameMap);
          return;
        }
        rows.forEach(function (r) {
          var authorName = r.author_id ? (nameMap[r.author_id] || 'User #' + (Array.isArray(r.author_id) ? r.author_id[0] : r.author_id)) : 'Unknown';
          var dateStr = r.date ? String(r.date).replace('T', ' ').slice(0, 16) : '';
          var body = (r.body || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
          var attHtml = '';
          var aids = r.attachment_ids || [];
          if (aids.length) {
            var ids = aids.map(function (x) { return Array.isArray(x) ? x[0] : x; });
            attHtml = '<div class="o-chatter-attachments">' + ids.map(function (aid) {
              return '<a href="/web/attachment/download/' + aid + '" target="_blank" rel="noopener" class="o-chatter-attachment-link">Attachment</a>';
            }).join('') + '</div>';
          }
          container.insertAdjacentHTML('beforeend', '<div class="chatter-msg o-chatter-msg"><div class="o-chatter-msg-meta">' + authorName + ' · ' + dateStr + '</div><div class="o-chatter-msg-body">' + body + '</div>' + attHtml + '</div>');
        });
      };
      if (uniq.length) {
        return _ctx.rpc.callKw('res.users', 'name_get', [uniq], {}).then(function (names) {
          (names || []).forEach(function (n) { if (n && n[0]) nameMap[n[0]] = n[1] || ''; });
          renderRows();
        });
      }
      renderRows();
    }).catch(function () {
      if (useStrip) {
        CS.setChatterError(container, 'Could not load messages.');
      } else {
        container.innerHTML = '<p class="o-chatter-error">Could not load messages.</p>';
      }
    });
  }

  /* ──────────────────────────────────────────────
   * 25. setupChatter
   * ────────────────────────────────────────────── */
  function setupChatter(form, model, recordId) {
    var chatterDiv = form.querySelector('#chatter-messages');
    if (!chatterDiv || !recordId) return;
    var sendBtn = form.querySelector('#chatter-send');
    var inputEl = form.querySelector('#chatter-input');
    var sendEmailCb = form.querySelector('#chatter-send-email');
    var fileInput = form.querySelector('#chatter-file');
    var pendingAttachmentIds = [];
    if (fileInput) {
      fileInput.onchange = function () {
        var files = fileInput.files;
        if (!files || !files.length) return;
        pendingAttachmentIds = [];
        var done = 0, total = files.length;
        function checkDone() {
          var span = form.querySelector('#chatter-attachments');
          if (span) span.textContent = pendingAttachmentIds.length ? pendingAttachmentIds.length + ' file(s) attached' : '';
          if (done === total && pendingAttachmentIds.length < total) _ctx.showToast('Some uploads failed', 'error');
        }
        Array.prototype.forEach.call(files, function (f) {
          var fd = new FormData();
          fd.append('file', f);
          fd.append('res_model', model);
          fd.append('res_id', recordId);
          var uploadHdrs = (window.Services && window.Services.session && window.Services.session.getAuthHeaders) ? window.Services.session.getAuthHeaders() : {};
          fetch('/web/attachment/upload', { method: 'POST', credentials: 'include', headers: uploadHdrs, body: fd })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              done++;
              if (data.id) pendingAttachmentIds.push(data.id);
              if (data.error) _ctx.showToast(data.error, 'error');
              checkDone();
            })
            .catch(function () { done++; _ctx.showToast('Upload failed', 'error'); checkDone(); });
        });
      };
    }
    if (sendBtn && inputEl) {
      sendBtn.onclick = function () {
        var body = (inputEl.value || '').trim();
        if (!body && !pendingAttachmentIds.length) return;
        sendBtn.disabled = true;
        var sendAsEmail = sendEmailCb && sendEmailCb.checked;
        var kwargs = { send_as_email: sendAsEmail };
        if (pendingAttachmentIds.length) kwargs.attachment_ids = pendingAttachmentIds;
        _ctx.rpc.callKw(model, 'message_post', [[parseInt(recordId, 10)], body || ''], kwargs)
          .then(function () {
            sendBtn.disabled = false;
            inputEl.value = '';
            pendingAttachmentIds = [];
            if (fileInput) { fileInput.value = ''; var s = form.querySelector('#chatter-attachments'); if (s) s.textContent = ''; }
            _ctx.showToast('Message posted', 'success');
            _ctx.rpc.callKw(model, 'read', [[parseInt(recordId, 10)], ['message_ids']]).then(function (recs) {
              if (recs && recs[0] && recs[0].message_ids) loadChatter(model, recordId, recs[0].message_ids);
            });
          })
          .catch(function (err) {
            sendBtn.disabled = false;
            _ctx.showToast(err.message || 'Failed to post', 'error');
          });
      };
    }
  }

  /* ──────────────────────────────────────────────
   * 26. getOne2manyLineFields
   * ────────────────────────────────────────────── */
  function getOne2manyLineFields(model, fname) {
    var o2m = getOne2manyInfo(model, fname);
    if (!o2m) return [];
    if (model === 'crm.lead' && fname === 'activity_ids') return ['summary', 'note', 'date_deadline', 'state'];
    if (model === 'sale.order' && fname === 'order_line') return ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'];
    if (model === 'mrp.bom' && fname === 'bom_line_ids') return ['product_id', 'product_qty'];
    if (model === 'hr.expense.sheet' && fname === 'expense_line_ids') return ['name', 'product_id', 'unit_amount', 'quantity', 'total_amount'];
    var meta = _ctx.viewsSvc ? _ctx.viewsSvc.getFieldsMeta(o2m.comodel) : null;
    if (meta) {
      var skip = ['id', (o2m.inverse || '').replace(/_id$/, '') + '_id'];
      return Object.keys(meta).filter(function (k) { return skip.indexOf(k) < 0 && meta[k].type !== 'one2many' && meta[k].type !== 'many2many'; });
    }
    return ['name'];
  }

  /* ──────────────────────────────────────────────
   * 27. getMany2manyInfo
   * ────────────────────────────────────────────── */
  function getMany2manyInfo(model, fname) {
    var def = getViewFieldDef(model, fname);
    if (def && def.comodel) {
      var meta = getFieldMeta(model, fname);
      if (meta && meta.type === 'many2many') return { comodel: def.comodel };
      if (meta && meta.type === 'many2one') return null;
      return { comodel: def.comodel };
    }
    var meta2 = getFieldMeta(model, fname);
    if (meta2 && meta2.type === 'many2many' && meta2.comodel) return { comodel: meta2.comodel };
    return null;
  }

  /* ──────────────────────────────────────────────
   * 28. getFieldLabel
   * ────────────────────────────────────────────── */
  function getFieldLabel(model, fname) {
    var meta = getFieldMeta(model, fname);
    if (meta && meta.string) return meta.string;
    return fname.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ──────────────────────────────────────────────
   * 29. isTextField
   * ────────────────────────────────────────────── */
  function isTextField(model, fname) {
    var meta = getFieldMeta(model, fname);
    if (meta) return meta.type === 'text' || meta.type === 'html';
    return fname === 'description' || fname === 'note_html';
  }

  /* ──────────────────────────────────────────────
   * 30. parseDomain
   * ────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────
   * 31. evaluateDomain
   * ────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────
   * 32. evaluateCondition
   * ────────────────────────────────────────────── */
  function evaluateCondition(domainStr, formVals) {
    var domain = parseDomain(domainStr);
    return domain !== null ? evaluateDomain(domain, formVals) : false;
  }

  /* ──────────────────────────────────────────────
   * 33. applyAttrsToForm
   * ────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────
   * 34. renderFieldHtml
   * ────────────────────────────────────────────── */
  function renderFieldHtml(model, f) {
    var fname = typeof f === 'object' ? f.name : f;
    var label = getFieldLabel(model, fname);
    var widget = typeof f === 'object' ? f.widget : '';
    if (window.FieldWidgets && window.FieldWidgets.render && widget) {
      var fieldNode = typeof f === 'object' ? f : { name: fname, widget: widget };
      var custom = window.FieldWidgets.render(model, fieldNode, { getFieldLabel: getFieldLabel, getFieldMeta: getFieldMeta });
      if (custom) {
        if (typeof f === 'object' && (f.invisible || f.readonly || f.required_cond)) {
          var ad = (f.invisible ? ' data-invisible="' + String(f.invisible).replace(/"/g, '&quot;') + '"' : '') + (f.readonly ? ' data-readonly="' + String(f.readonly).replace(/"/g, '&quot;') + '"' : '') + (f.required_cond ? ' data-required-cond="' + String(f.required_cond).replace(/"/g, '&quot;') + '"' : '');
          return '<div class="attr-field" data-fname="' + fname + '"' + ad + '>' + custom + '</div>';
        }
        return '<div class="attr-field" data-fname="' + fname + '">' + custom + '</div>';
      }
    }
    if (widget === 'priority') {
      var selectionOpts = getSelectionOptions(model, fname) || [['0', 'Low'], ['1', 'Normal'], ['2', 'High'], ['3', 'Urgent']];
      var opts = '';
      selectionOpts.forEach(function (o) { opts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
      return '<p><label>' + label + '</label><div class="priority-widget" data-fname="' + fname + '" style="margin-top:0.25rem;display:flex;gap:0.25rem;align-items:center"><span class="priority-stars" style="font-size:1.2rem;color:#f0ad4e">&#9733;&#9733;&#9733;&#9733;</span><select name="' + fname + '" style="width:auto;padding:0.25rem">' + opts + '</select></div></p>';
    }
    if (widget === 'phone' || ((fname === 'phone' || fname === 'mobile') && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="text" name="' + fname + '" style="width:100%;padding:0.5rem"><a class="phone-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Call</a></div></p>';
    }
    if (widget === 'email' || (fname === 'email' && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="email" name="' + fname + '" style="width:100%;padding:0.5rem"><a class="email-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Send</a></div></p>';
    }
    if (widget === 'url' || (fname === 'website' && !widget)) {
      return '<p><label>' + label + '</label><div style="margin-top:0.25rem"><input type="url" name="' + fname + '" placeholder="https://" style="width:100%;padding:0.5rem"><a class="url-link" href="#" style="font-size:0.9rem;margin-left:0.25rem;display:inline-block;margin-top:0.25rem" target="_blank">Open</a></div></p>';
    }
    if (widget === 'statusbar') {
      var sbId = 'statusbar-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + '</label><div class="o-statusbar" id="' + sbId + '" data-fname="' + fname + '" data-comodel="' + (f.comodel || '') + '" data-clickable="1" style="margin-top:0.25rem;display:flex;align-items:center;gap:0;flex-wrap:wrap"></div><input type="hidden" name="' + fname + '"></p>';
    }
    var o2m = getOne2manyInfo(model, fname);
    var m2m = getMany2manyInfo(model, fname);
    if (fname === 'message_ids' && (model === 'crm.lead' || model === 'project.task' || model === 'helpdesk.ticket')) {
      if (window.AppCore && window.AppCore.ChatterStrip && typeof window.AppCore.ChatterStrip.buildChatterChromeHtml === 'function') {
        return window.AppCore.ChatterStrip.buildChatterChromeHtml({ model: model, label: label });
      }
      return '<p><label>' + label + '</label><div id="chatter-messages" class="o-chatter o-chatter-chrome o-card-gradient" data-model="' + model + '"><header class="o-chatter-chrome-head" aria-label="Discussion"><span class="o-chatter-chrome-title">Activity</span></header><div class="chatter-messages-list o-chatter-messages-scroll"></div><div class="chatter-compose o-chatter-compose"><textarea id="chatter-input" class="o-chatter-textarea" placeholder="Add a comment..." rows="3"></textarea><div class="o-chatter-compose-row"><input type="file" id="chatter-file" class="o-chatter-file" multiple><span id="chatter-attachments" class="o-chatter-attachments-hint"></span></div><label class="o-chatter-send-email-label"><input type="checkbox" id="chatter-send-email"> Send as email</label><button type="button" id="chatter-send" class="o-btn o-btn-primary o-chatter-send">Send</button></div></div></p>';
    }
    if (o2m) {
      var lineFields = getOne2manyLineFields(model, fname);
      var headers = lineFields.map(function (lf) { return '<th style="text-align:left;padding:0.35rem">' + (lf.charAt(0).toUpperCase() + lf.slice(1)) + '</th>'; }).join('');
      var rowHtml = lineFields.map(function (lf) { return '<td style="padding:0.25rem"><input type="text" data-o2m-field="' + lf + '" style="width:100%;padding:0.25rem;font-size:0.9rem" placeholder="' + lf + '"></td>'; }).join('');
      var addId = 'o2m-add-' + fname;
      return '<p><label>' + label + '</label><div id="o2m-' + fname + '" class="o2m-editable" data-comodel="' + (o2m.comodel || '') + '" data-inverse="' + (o2m.inverse || '') + '" data-fname="' + fname + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px"><table style="width:100%;font-size:0.9rem"><thead><tr>' + headers + '<th style="width:1%"></th></tr></thead><tbody id="o2m-tbody-' + fname + '"></tbody></table><button type="button" id="' + addId + '" class="o2m-add-line" style="margin-top:0.25rem;padding:0.25rem 0.5rem;font-size:0.85rem;cursor:pointer">Add a line</button></div></p>';
    }
    if (m2m) {
      var tagsClass = (widget === 'many2many_tags') ? ' m2m-tags' : '';
      return '<p><label>' + label + '</label><div id="m2m-' + fname + '" class="m2m-widget' + tagsClass + '" data-comodel="' + (m2m.comodel || '') + '" data-widget="' + (widget || '') + '" style="margin-top:0.25rem;padding:0.5rem;background:#f8f8f8;border-radius:4px;min-height:2em;display:flex;flex-wrap:wrap;gap:0.25rem"></div></p>';
    }
    var meta = getFieldMeta(model, fname);
    var required = (meta && meta.required) || fname === 'name';
    var comodel = getMany2oneComodel(model, fname);
    var selOpts = getSelectionOptions(model, fname);
    var isBool = isBooleanField(model, fname);
    var isImg = isImageField(model, fname);
    var isBin = isBinaryField(model, fname);
    var isHtml = isHtmlField(model, fname);
    var isTextarea = isTextField(model, fname) && !isHtml;
    var isMonetary = isMonetaryField(model, fname);
    if (meta && meta.type === 'date') {
      var fro = typeof f === 'object' && f.readonly ? ' readonly' : '';
      return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="date" name="' + fname + '" ' + (required ? 'required ' : '') + fro + ' style="width:100%;max-width:16rem;padding:0.5rem;margin-top:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></label></p>';
    }
    if (meta && meta.type === 'datetime') {
      var fro2 = typeof f === 'object' && f.readonly ? ' readonly' : '';
      return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="datetime-local" name="' + fname + '" ' + (required ? 'required ' : '') + fro2 + ' style="width:100%;max-width:22rem;padding:0.5rem;margin-top:0.25rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></label></p>';
    }
    var inputType = isImg ? 'image' : (isBin ? 'binary' : (isHtml ? 'html' : (isBool ? 'boolean' : (isMonetary ? 'monetary' : (fname === 'email' ? 'email' : isTextarea ? 'textarea' : selOpts ? 'selection' : (comodel ? 'many2one' : 'text'))))));
    if (inputType === 'boolean') return '<p><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="' + fname + '"> ' + label + '</label></p>';
    if (inputType === 'html') return '<p><label>' + label + (required ? ' *' : '') + '</label><div id="html-' + fname + '" class="html-widget" data-fname="' + fname + '" contenteditable="true" style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:6em;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)"></div><input type="hidden" name="' + fname + '" id="hidden-html-' + fname + '"></p>';
    if (inputType === 'textarea') return '<p><label>' + label + (required ? ' *' : '') + '<br><textarea name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem;min-height:4em"></textarea></label></p>';
    if (inputType === 'selection') {
      var sOpts = '<option value="">--</option>';
      selOpts.forEach(function (o) { sOpts += '<option value="' + (o[0] || '') + '">' + (o[1] || o[0]) + '</option>'; });
      return '<p><label>' + label + (required ? ' *' : '') + '<br><select name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem">' + sOpts + '</select></label></p>';
    }
    if (inputType === 'many2one') {
      var domainInfo = getMany2oneDomain(model, fname);
      var depAttr = domainInfo ? ' data-depends-on="' + domainInfo.depField + '"' : '';
      var wid = 'm2o-' + fname + '-' + Math.random().toString(36).slice(2);
      return '<p><label>' + label + (required ? ' *' : '') + '</label><div class="m2one-widget" id="' + wid + '" data-comodel="' + (comodel || '') + '" data-fname="' + fname + '" data-domain="' + (domainInfo ? encodeURIComponent(JSON.stringify(domainInfo)) : '') + '"' + depAttr + ' style="margin-top:0.25rem;position:relative"><input type="text" class="m2one-input" placeholder="Search..." autocomplete="off" style="width:100%;padding:0.5rem"><input type="hidden" name="' + fname + '" class="m2one-value"><div class="m2one-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--color-surface-1);border:1px solid var(--border-color);border-radius:var(--radius-sm);max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 4px 8px rgba(0,0,0,0.1)"></div></div></p>';
    }
    if (inputType === 'binary') return '<p><label>' + label + '<br><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="*/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem"></span></label></p>';
    if (inputType === 'image') return '<p><label>' + label + '</label><div id="image-' + fname + '" class="image-widget" data-fname="' + fname + '" style="margin-top:0.25rem"><img id="img-preview-' + fname + '" src="" alt="" style="max-width:200px;max-height:150px;display:none;border-radius:var(--radius-sm);border:1px solid var(--border-color)"><input type="file" id="file-' + fname + '" data-field="' + fname + '" accept="image/*" style="width:100%;padding:0.5rem;margin-top:0.25rem"><input type="hidden" name="' + fname + '" id="hidden-' + fname + '"><span id="bin-status-' + fname + '" style="font-size:0.85rem;color:#666;margin-left:0.25rem;display:block;margin-top:0.25rem"></span></div></p>';
    if (inputType === 'monetary') return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="number" name="' + fname + '" step="0.01" min="0" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
    return '<p><label>' + label + (required ? ' *' : '') + '<br><input type="' + inputType + '" name="' + fname + '" ' + (required ? 'required' : '') + ' style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
  }

  /* ──────────────────────────────────────────────
   * 35. renderFormTreeToHtml
   * ────────────────────────────────────────────── */
  function renderFormTreeToHtml(model, children, opts) {
    opts = opts || {};
    var recordId = opts.recordId;
    var route = opts.route || '';
    var isNew = opts.isNew;
    var html = '';
    (children || []).forEach(function (c) {
      if (c.type === 'header') {
        html += '<div class="o-form-header">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'sheet') {
        html += '<div class="o-form-sheet">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button_box') {
        html += '<div class="o-button-box">' + renderFormTreeToHtml(model, c.children || [], opts) + '</div>';
      } else if (c.type === 'button') {
        var btnName = c.name || '';
        var btnType = c.button_type || c.action_type || (c.attrs && c.attrs.type) || 'object';
        var btnStr = (c.string || btnName).replace(/</g, '&lt;');
        html += '<button type="button" class="btn-action-' + btnType + (c.class ? ' ' + c.class : '') + '" data-action="' + btnName + '" data-btn-type="' + btnType + '" style="padding:0.35rem 0.75rem;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;background:var(--color-surface-1);font-size:0.9rem">' + btnStr + '</button>';
      } else if (c.type === 'field') {
        var fieldHtml = renderFieldHtml(model, c);
        var fnameF = c.name || '';
        if ((c.invisible || c.readonly || c.required_cond) && fieldHtml) {
          var adF = (c.invisible ? ' data-invisible="' + String(c.invisible).replace(/"/g, '&quot;') + '"' : '') + (c.readonly ? ' data-readonly="' + String(c.readonly).replace(/"/g, '&quot;') + '"' : '') + (c.required_cond ? ' data-required-cond="' + String(c.required_cond).replace(/"/g, '&quot;') + '"' : '');
          html += '<div class="attr-field" data-fname="' + fnameF + '"' + adF + '>' + fieldHtml + '</div>';
        } else if (fieldHtml) {
          html += '<div class="attr-field" data-fname="' + fnameF + '">' + fieldHtml + '</div>';
        }
      }
      else if (c.type === 'group') {
        html += '<div class="form-group">';
        if (c.string) html += '<div class="form-group-title">' + (c.string || '').replace(/</g, '&lt;') + '</div>';
        html += renderFormTreeToHtml(model, c.children || [], opts);
        html += '</div>';
      } else if (c.type === 'notebook' && c.pages && c.pages.length) {
        var nbId = 'nb-' + Math.random().toString(36).slice(2);
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

  /** Bounded wait for dominant form load RPCs (`read`, `default_get`); mirrors list `loadRecords` deadline (phase 810). */
  var FORM_LOAD_RPC_DEADLINE_MS = 25000;

  function formLoadRpcDeadlineReject() {
    return new Promise(function (_, rej) {
      setTimeout(function () {
        rej(new Error('Form data request timed out. Check your connection or try again.'));
      }, FORM_LOAD_RPC_DEADLINE_MS);
    });
  }

  function raceFormLoadRpc(promise) {
    return Promise.race([promise, formLoadRpcDeadlineReject()]);
  }

  function renderFormLoadFailure(title, err, retryFn) {
    var safeTitle = (title || 'Form').replace(/</g, '&lt;');
    var msg = err && err.message ? String(err.message).replace(/</g, '&lt;') : 'Failed to load';
    _ctx.main.innerHTML =
      '<h2>' + safeTitle + '</h2>' +
      '<p class="error o-form-load-error">' + msg + '</p>' +
      '<div class="o-form-load-retry-wrap"><button type="button" class="o-btn o-btn-primary" id="o-form-load-retry">Retry</button></div>';
    var retryBtn = document.getElementById('o-form-load-retry');
    if (retryBtn && typeof retryFn === 'function') {
      retryBtn.onclick = function () { retryFn(); };
    }
  }

  /* ──────────────────────────────────────────────
   * 36. renderForm  (main entry – includes wireFormViewAfterPaint)
   * ────────────────────────────────────────────── */
  function renderForm(model, route, id, _skipCore) {
    var FormViewCore = window.AppCore && window.AppCore.FormView ? window.AppCore.FormView : null;
    if (!_skipCore && FormViewCore && typeof FormViewCore.render === 'function') {
      var coreHandled = FormViewCore.render(_ctx.main, {
        model: model,
        route: route,
        id: id,
      });
      if (coreHandled) return;
    }
    _ctx.setFormDirty(false);
    if (typeof window !== 'undefined') window.chatContext = { model: model, active_id: id ? parseInt(id, 10) : null };
    var fields = _ctx.getFormFields(model);
    var formView = _ctx.viewsSvc ? _ctx.viewsSvc.getView(model, 'form') : null;
    var children = formView && formView.children ? formView.children : null;
    var title = _ctx.getTitle(route);
    var isNew = !id;
    var formTitle = isNew ? ('New ' + title.slice(0, -1)) : ('Edit ' + title.slice(0, -1));
    var formLeaf = isNew ? route + '/new' : route + '/edit/' + id;
    var actionStack = _ctx.getActionStack();
    var lastEntry = actionStack.length ? actionStack[actionStack.length - 1] : null;
    var lastH = lastEntry ? String(lastEntry.hash || '').split('?')[0] : '';
    var routeBase = String(route || '').split('?')[0];
    if (lastH === formLeaf) {
      /* Phase 696: ?stack= decode already ends on this form — avoid duplicate crumbs. */
    } else if (lastH === routeBase) {
      _ctx.pushBreadcrumb(formTitle, formLeaf);
    } else if (actionStack.length === 0) {
      _ctx.pushBreadcrumb(title, route);
      _ctx.pushBreadcrumb(formTitle, formLeaf);
    } else {
      _ctx.pushBreadcrumb(formTitle, formLeaf);
    }

    /* ── wireFormViewAfterPaint ───────────────── */
    function wireFormViewAfterPaint(hostMain) {
      var main = hostMain;
      var form = document.getElementById('record-form');
      main.querySelectorAll('.o-shortcut-target[data-shortcut]').forEach(function (el) {
        var k = el.getAttribute('data-shortcut');
        if (k) el.title = (el.title ? el.title + ' ' : '') + '(' + k + ')';
      });
      var previewBtn = document.getElementById('btn-preview-form');
      if (previewBtn) {
        previewBtn.onclick = function () {
          var reportName = _ctx.getReportName(model);
          if (!reportName || !id) return;
          var url = '/report/pdf/' + reportName + '/' + id;
          if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === 'function') {
            window.UIComponents.PdfViewer.open(url, 'Record Preview');
          } else {
            window.open(url, '_blank', 'noopener');
          }
        };
      }
      var printFormA = document.getElementById('btn-print-form');
      if (printFormA && _ctx.getReportName(model) && id) {
        printFormA.addEventListener('click', function (e) {
          e.preventDefault();
          var rn = _ctx.getReportName(model);
          if (!rn || !id) return;
          var pdfUrl = '/report/pdf/' + rn + '/' + id;
          if (window.UIComponents && window.UIComponents.PdfViewer && typeof window.UIComponents.PdfViewer.open === 'function') {
            window.UIComponents.PdfViewer.open(pdfUrl, 'Print preview');
          } else {
            window.open(printFormA.getAttribute('href') || '#', '_blank', 'noopener');
          }
        });
      }

      fields.forEach(function (f) {
        var fn = typeof f === 'object' ? f.name : f;
        if (isHtmlField(model, fn)) {
          var htmlDiv = document.getElementById('html-' + fn);
          var hiddenIn = document.getElementById('hidden-html-' + fn);
          if (htmlDiv && hiddenIn) {
            var syncHtml = function () { hiddenIn.value = htmlDiv.innerHTML || ''; };
            htmlDiv.addEventListener('input', syncHtml);
            htmlDiv.addEventListener('blur', syncHtml);
          }
        }
        if (isBinaryField(model, fn) || isImageField(model, fn)) {
          var fileIn = document.getElementById('file-' + fn);
          var hiddenInB = document.getElementById('hidden-' + fn);
          var statusSpan = document.getElementById('bin-status-' + fn);
          var imgPreview = document.getElementById('img-preview-' + fn);
          if (fileIn && hiddenInB) {
            fileIn.onchange = function () {
              var file = fileIn.files && fileIn.files[0];
              if (!file) { hiddenInB.value = ''; if (statusSpan) statusSpan.textContent = ''; if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; } return; }
              var r = new FileReader();
              r.onload = function () {
                var dataUrl = r.result;
                var base64 = (dataUrl && dataUrl.indexOf(',') >= 0) ? dataUrl.split(',')[1] : '';
                hiddenInB.value = base64;
                if (statusSpan) statusSpan.textContent = file.name + ' (' + (file.size < 1024 ? file.size + ' B' : (file.size / 1024).toFixed(1) + ' KB') + ')';
                if (imgPreview && file.type && file.type.startsWith('image/')) {
                  imgPreview.src = dataUrl;
                  imgPreview.style.display = 'block';
                }
              };
              r.readAsDataURL(file);
            };
          }
          if (imgPreview) {
            imgPreview.onclick = function () {
              if (!imgPreview.src) return;
              if (window.UIComponents && window.UIComponents.AttachmentViewer && typeof window.UIComponents.AttachmentViewer.open === 'function') {
                window.UIComponents.AttachmentViewer.open([
                  { name: fn, url: imgPreview.src, mimetype: 'image/*' },
                ], 0);
              } else {
                window.open(imgPreview.src, '_blank', 'noopener');
              }
            };
            imgPreview.style.cursor = 'zoom-in';
          }
        }
      });

      main.querySelectorAll('[data-btn-type]').forEach(function (btn) {
        var actionName = btn.getAttribute('data-action');
        var buttonType = btn.getAttribute('data-btn-type') || 'object';
        if (!actionName || isNew) return;
        btn.onclick = function () {
          btn.disabled = true;
          var runner = (window.ActionManager && typeof window.ActionManager.doActionButton === 'function')
            ? window.ActionManager.doActionButton({
                rpc: _ctx.rpc,
                buttonType: buttonType,
                actionId: actionName,
                model: model,
                method: actionName,
                resId: parseInt(id, 10),
                context: { active_model: model, active_id: parseInt(id, 10), active_ids: [parseInt(id, 10)] },
              })
            : _ctx.rpc.callKw(model, actionName, [[parseInt(id, 10)]], {});
          runner
            .then(function (result) {
              btn.disabled = false;
              if (result && typeof result === 'object' && result.type === 'ir.actions.act_window' && result.res_model) {
                if (result.target === 'new' && window.UIComponents && window.UIComponents.ConfirmDialog && typeof window.UIComponents.ConfirmDialog.openModal === 'function') {
                  var wizardTrail = ['Wizard'];
                  var current = result;
                  var modal = window.UIComponents.ConfirmDialog.openModal({
                    title: result.name || 'Wizard',
                    breadcrumbs: wizardTrail,
                    bodyHtml: '<p style="margin:0 0 var(--space-sm)">Wizard action returned <code>' + String(result.res_model || '').replace(/</g, '&lt;') + '</code>.</p><p style="color:var(--text-muted);margin:0">Complete the wizard and close to refresh parent view.</p>',
                    onClose: function () { renderForm(model, route, id); },
                  });
                  while (current && current.next_action) {
                    current = current.next_action;
                    wizardTrail.push(current.name || 'Step');
                  }
                  if (modal && modal.setBreadcrumbs) modal.setBreadcrumbs(wizardTrail);
                  return;
                }
                var actRoute = (result.res_model || '').replace(/\./g, '_');
                var resId = result.res_id;
                if (actRoute && resId) {
                  window.location.hash = '#' + actRoute + '/edit/' + resId;
                  route();
                  return;
                }
              }
              _ctx.showToast('Action completed', 'success');
              renderForm(model, route, id);
            })
            .catch(function (err) {
              btn.disabled = false;
              _ctx.showToast(err.message || 'Action failed', 'error');
            });
        };
      });

      if (window.AppCore && window.AppCore.NotebookWidget && typeof window.AppCore.NotebookWidget.wire === 'function') {
        window.AppCore.NotebookWidget.wire(main);
      } else {
        main.querySelectorAll('.form-notebook').forEach(function (nb) {
          var tabs = nb.querySelectorAll('.notebook-tab');
          var pages = nb.querySelectorAll('.notebook-page');
          tabs.forEach(function (tab, i) {
            tab.onclick = function () {
              tabs.forEach(function (t) { t.classList.remove('active'); });
              pages.forEach(function (p) { p.classList.remove('active'); });
              tab.classList.add('active');
              var page = nb.querySelector('.notebook-page[data-page="' + i + '"]');
              if (page) page.classList.add('active');
            };
          });
        });
      }

      var selects = form.querySelectorAll('select[data-comodel]');
      var m2oneWidgets = form.querySelectorAll('.m2one-widget');
      var m2mDivs = form.querySelectorAll('[id^="m2m-"]');
      var m2oneSearchDebounce = {};

      var setupM2oneWidget = function (widget) {
        var comodel = widget.dataset.comodel;
        var fname = widget.dataset.fname;
        if (!comodel) return;
        var inputEl = widget.querySelector('.m2one-input');
        var valueEl = widget.querySelector('.m2one-value');
        var dropdownEl = widget.querySelector('.m2one-dropdown');
        if (!inputEl || !valueEl || !dropdownEl) return;
        var getDomain = function () {
          try {
            var d = widget.dataset.domain;
            if (!d) return [];
            var info = JSON.parse(decodeURIComponent(d));
            var depVal = getFormFieldVal(info.depField);
            return depVal ? [[info.depField, '=', depVal]] : [[info.depField, '=', 0]];
          } catch (e) { return []; }
        };
        var doSearch = function () {
          var term = (inputEl.value || '').trim();
          var domain = getDomain();
          _ctx.rpc.callKw(comodel, 'name_search', [term, domain, 'ilike', 8], {})
            .then(function (results) {
              dropdownEl.innerHTML = '';
              dropdownEl.style.display = results.length ? 'block' : 'none';
              results.forEach(function (r) {
                var rId = r[0], name = r[1] || String(rId);
                var item = document.createElement('div');
                item.className = 'm2one-dropdown-item';
                item.style.cssText = 'padding:0.5rem;cursor:pointer';
                item.textContent = name;
                item.dataset.id = rId;
                item.dataset.name = name;
                item.onmouseover = function () { item.style.background = '#f0f0f0'; };
                item.onmouseout = function () { item.style.background = ''; };
                item.onclick = function () {
                  valueEl.value = rId;
                  inputEl.value = name;
                  dropdownEl.style.display = 'none';
                  inputEl.dataset.display = name;
                  form.querySelectorAll('.m2one-widget[data-depends-on="' + fname + '"]').forEach(function (w) {
                    var v = w.querySelector('.m2one-value');
                    var iEl = w.querySelector('.m2one-input');
                    if (v) v.value = '';
                    if (iEl) { iEl.value = ''; delete iEl.dataset.display; }
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
            _ctx.rpc.callKw(comodel, 'name_search', ['', getDomain(), 'ilike', 8], {}).then(function (results) {
              dropdownEl.innerHTML = '';
              dropdownEl.style.display = results.length ? 'block' : 'none';
              results.forEach(function (r) {
                var item = document.createElement('div');
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
          var key = fname;
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
              _ctx.rpc.callKw(comodel, 'name_get', [[parseInt(valueEl.value, 10)]], {}).then(function (res) {
                if (res && res[0]) inputEl.dataset.display = res[0][1];
              });
            }
          }, 200);
        };
        var depAttr = widget.getAttribute('data-depends-on');
        if (depAttr) {
          var depWidget = form.querySelector('.m2one-widget[data-fname="' + depAttr + '"]');
          var depInput = depWidget ? depWidget.querySelector('.m2one-input') : form.querySelector('[name="' + depAttr + '"]');
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

      var getFormFieldVal = function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? (el.value ? parseInt(el.value, 10) || el.value : null) : null;
      };

      var loadSelectOptions = function (sel, domain) {
        var comodel = sel.dataset.comodel;
        if (!comodel) return Promise.resolve();
        var d = domain || [];
        return _ctx.rpc.callKw(comodel, 'search_read', [d], { fields: ['id', 'name'], limit: 200 })
          .then(function (opts) {
            sel.innerHTML = '<option value="">--</option>';
            opts.forEach(function (o) {
              sel.appendChild(document.createElement('option')).value = o.id;
              sel.lastChild.textContent = o.name || o.id;
            });
          });
      };

      m2oneWidgets.forEach(function (w) { setupM2oneWidget(w); });

      var statusbars = form.querySelectorAll('.o-statusbar');

      var setupStatusbar = function (sb, options, currentVal, isNewRec) {
        sb.innerHTML = '';
        var clickable = sb.getAttribute('data-clickable') !== '0';
        var fname = sb.dataset.fname;
        var hiddenInput = form.querySelector('input[name="' + fname + '"]');
        if (!hiddenInput) return;
        var currentId = currentVal != null ? currentVal : null;
        if (currentId != null) hiddenInput.value = currentId;
        var currentIdx = -1;
        if (currentId != null) {
          for (var i = 0; i < options.length; i++) {
            var oid = options[i].id != null ? options[i].id : options[i][0];
            if (String(oid) === String(currentId)) { currentIdx = i; break; }
          }
        }
        options.forEach(function (opt, idx) {
          var item = document.createElement('span');
          item.className = 'o-statusbar-item';
          var optId = opt.id != null ? opt.id : opt[0];
          var optName = opt.name != null ? opt.name : (opt[1] || opt[0]);
          item.textContent = optName;
          item.dataset.value = String(optId);
          if (String(optId) === String(currentId) || (currentId == null && idx === 0)) item.classList.add('o-statusbar-item--active');
          if (currentIdx >= 0 && idx < currentIdx) item.classList.add('o-statusbar-item--done');
          if (clickable) {
            item.style.cursor = 'pointer';
            item.onclick = function () {
              var raw = item.dataset.value;
              var val = /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
              hiddenInput.value = raw;
              if (isNewRec) {
                statusbars.forEach(function (s) {
                  if (s.dataset.fname === fname) {
                    s.querySelectorAll('.o-statusbar-item').forEach(function (si) { si.classList.remove('o-statusbar-item--active'); });
                    item.classList.add('o-statusbar-item--active');
                  }
                });
              } else {
                _ctx.rpc.callKw(model, 'write', [[parseInt(id, 10)], Object.fromEntries([[fname, val]])], {})
                  .then(function () {
                    _ctx.showToast('Stage updated', 'success');
                    loadRecord(model, id).then(function (r) {
                      if (r && r[0]) {
                        var rec = r[0];
                        var newCurrent = rec[fname];
                        statusbars.forEach(function (s) {
                          if (s.dataset.fname === fname) {
                            var items = s.querySelectorAll('.o-statusbar-item');
                            var newIdx = -1;
                            for (var j = 0; j < items.length; j++) {
                              if (String(items[j].dataset.value) === String(newCurrent)) { newIdx = j; break; }
                            }
                            items.forEach(function (si, j) {
                              si.classList.remove('o-statusbar-item--active', 'o-statusbar-item--done');
                              if (j === newIdx) si.classList.add('o-statusbar-item--active');
                              else if (newIdx >= 0 && j < newIdx) si.classList.add('o-statusbar-item--done');
                            });
                          }
                        });
                      }
                    }).catch(function () { /* refresh-only; avoid replacing main on deadline */ });
                  })
                  .catch(function (err) { _ctx.showToast(err.message || 'Failed to update', 'error'); });
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

      var renderM2mTags = function (div, fname, opts, selectedIds, nameMap, onchange) {
        var idSet = (selectedIds || []).map(function (x) { return String(x); });
        var html = '';
        (selectedIds || []).forEach(function (sid) {
          var name = nameMap[sid] || ('#' + sid);
          html += '<span class="m2m-tag-chip" data-id="' + sid + '" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--color-primary,#1a1a2e);color:white;border-radius:999px;font-size:0.85rem">' + String(name).replace(/</g, '&lt;') + ' <span class="m2m-tag-remove" style="cursor:pointer;opacity:0.8">×</span></span>';
        });
        var unselected = opts.filter(function (o) { return idSet.indexOf(String(o.id)) < 0; });
        html += '<select class="m2m-tag-add" data-fname="' + fname + '" style="min-width:8rem;padding:0.2rem 0.5rem;font-size:0.85rem;border:1px dashed #999;border-radius:4px;background:transparent"><option value="">+ Add</option>';
        unselected.forEach(function (o) {
          html += '<option value="' + o.id + '">' + String(o.name || o.id).replace(/</g, '&lt;') + '</option>';
        });
        html += '</select>';
        div.innerHTML = html;
        div.querySelectorAll('.m2m-tag-chip').forEach(function (chip) {
          var remove = chip.querySelector('.m2m-tag-remove');
          if (remove) {
            remove.onclick = function () {
              var cid = parseInt(chip.dataset.id, 10);
              var ids = [];
              try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
              ids = ids.filter(function (x) { return x !== cid; });
              div.dataset.selected = JSON.stringify(ids);
              renderM2mTags(div, fname, opts, ids, nameMap, onchange);
              if (onchange) onchange(fname);
            };
          }
        });
        var addSel = div.querySelector('.m2m-tag-add');
        if (addSel) {
          addSel.onchange = function () {
            var val = addSel.value;
            if (!val) return;
            var addId = parseInt(val, 10);
            var ids = [];
            try { ids = JSON.parse(div.dataset.selected || '[]'); } catch (e) {}
            if (ids.indexOf(addId) >= 0) return;
            ids.push(addId);
            div.dataset.selected = JSON.stringify(ids);
            var o = opts.filter(function (x) { return x.id === addId; })[0];
            var nm = o ? (o.name || String(addId)) : String(addId);
            if (!nameMap[addId]) nameMap[addId] = nm;
            renderM2mTags(div, fname, opts, ids, nameMap, onchange);
            addSel.value = '';
            if (onchange) onchange(fname);
          };
        }
      };

      var loadOptions = function (formVals) {
        var promises = [];
        selects.forEach(function (sel) {
          var comodel = sel.dataset.comodel;
          var fname = sel.getAttribute('name');
          if (!comodel) return;
          var domainInfo = getMany2oneDomain(model, fname);
          var domain = [];
          if (domainInfo) {
            var depVal = formVals ? formVals[domainInfo.depField] : getFormFieldVal(domainInfo.depField);
            if (depVal) domain = [[domainInfo.depField, '=', depVal]];
            else domain = [[domainInfo.depField, '=', 0]];
          }
          promises.push(loadSelectOptions(sel, domain));
        });
        m2mDivs.forEach(function (div) {
          var comodel = div.dataset.comodel;
          var fname = (div.id || '').replace('m2m-', '');
          var isTags = div.dataset.widget === 'many2many_tags';
          var selectedIds = (formVals && formVals[fname]) ? (Array.isArray(formVals[fname]) ? formVals[fname] : [formVals[fname]]) : [];
          if (!comodel) return;
          promises.push(
            _ctx.rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], limit: 200 })
              .then(function (opts) {
                var nameMap = {};
                opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
                if (isTags) {
                  div.dataset.opts = JSON.stringify(opts);
                  div.dataset.selected = JSON.stringify(selectedIds);
                  renderM2mTags(div, fname, opts, selectedIds, nameMap, runServerOnchange);
                } else {
                  var inner = '';
                  var idSet2 = selectedIds.map(function (x) { return String(x); });
                  opts.forEach(function (o) {
                    var checked = idSet2.indexOf(String(o.id)) >= 0 ? ' checked' : '';
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
              _ctx.rpc.callKw(comodel, 'search_read', [[]], { fields: ['id', 'name'], order: 'sequence', limit: 50 })
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

      var onchangeDebounce = {};
      var runServerOnchange = function (fieldName) {
        var key = fieldName || '';
        if (onchangeDebounce[key]) clearTimeout(onchangeDebounce[key]);
        onchangeDebounce[key] = setTimeout(function () {
          onchangeDebounce[key] = null;
          var vals = getFormVals(form, model);
          _ctx.rpc.callKw(model, 'onchange', [fieldName, vals], {}).then(function (updates) {
            if (!updates || typeof updates !== 'object') return;
            Object.keys(updates).forEach(function (n) {
              var v = updates[n];
              var el = form.querySelector('[name="' + n + '"]');
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

      var setupDependsOnHandlers = function () {
        selects.forEach(function (sel) {
          var fname = sel.getAttribute('name');
          var domainInfo = getMany2oneDomain(model, fname);
          if (!domainInfo) return;
          var depEl = form.querySelector('[name="' + domainInfo.depField + '"]');
          if (depEl) {
            depEl.onchange = function () {
              runServerOnchange(domainInfo.depField);
              var depVal = getFormFieldVal(domainInfo.depField);
              loadSelectOptions(sel, depVal ? [[domainInfo.depField, '=', depVal]] : [[domainInfo.depField, '=', 0]])
                .then(function () {
                  var stateEl = form.querySelector('[name="' + fname + '"]');
                  if (stateEl) stateEl.value = '';
                });
            };
          }
        });
      };

      var setupOnchangeHandlers = function () {
        form.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (el) {
          if (el.type === 'file' || (el.name || '').indexOf('_cb') >= 0) return;
          var fieldName = el.getAttribute('name');
          if (!fieldName) return;
          var ev = el.tagName === 'TEXTAREA' || (el.type === 'text' || el.type === 'email') ? 'blur' : 'change';
          el.addEventListener(ev, function () { runServerOnchange(fieldName); });
        });
      };

      var o2mOnchangeDebounce = {};
      var setupO2mOnchangeHandlers = function () {
        form.querySelectorAll('[id^="o2m-"]').forEach(function (div) {
          var fname = div.dataset.fname;
          var o2m = getOne2manyInfo(model, fname);
          if (!o2m || !o2m.comodel) return;
          var lineFields = getOne2manyLineFields(model, fname);
          if (lineFields.indexOf('product_id') < 0) return;
          var tbody = div.querySelector('tbody');
          if (!tbody) return;
          var runLineOnchange = function (tr, fieldName) {
            var key = fname + '-' + fieldName;
            if (o2mOnchangeDebounce[key]) clearTimeout(o2mOnchangeDebounce[key]);
            o2mOnchangeDebounce[key] = setTimeout(function () {
              o2mOnchangeDebounce[key] = null;
              var rowVals = {};
              lineFields.forEach(function (lf) {
                var inp = tr.querySelector('[data-o2m-field="' + lf + '"]');
                if (inp) {
                  var v = inp.value;
                  if (lf === 'product_id' && /^\d+$/.test(String(v))) v = parseInt(v, 10);
                  else if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0 && v !== '') v = parseFloat(v) || 0;
                  rowVals[lf] = v;
                }
              });
              _ctx.rpc.callKw(o2m.comodel, 'onchange', [fieldName, rowVals], {}).then(function (updates) {
                if (!updates || typeof updates !== 'object') return;
                Object.keys(updates).forEach(function (n) {
                  var inp = tr.querySelector('[data-o2m-field="' + n + '"]');
                  if (inp) inp.value = updates[n] != null ? updates[n] : '';
                });
              }).catch(function () {});
            }, 300);
          };
          tbody.querySelectorAll('tr').forEach(function (tr) {
            var prodInp = tr.querySelector('[data-o2m-field="product_id"]');
            if (prodInp) prodInp.addEventListener('change', function () { runLineOnchange(tr, 'product_id'); });
          });
          var obs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
              m.addedNodes.forEach(function (node) {
                if (node.nodeType === 1 && node.tagName === 'TR') {
                  var prodInp = node.querySelector('[data-o2m-field="product_id"]');
                  if (prodInp) prodInp.addEventListener('change', function () { runLineOnchange(node, 'product_id'); });
                }
              });
            });
          });
          obs.observe(tbody, { childList: true });
        });
      };

      var setM2mChecked = function (fname, ids) {
        var div = form.querySelector('#m2m-' + fname);
        if (div && div.dataset.widget === 'many2many_tags') {
          var opts = [];
          try { opts = JSON.parse(div.dataset.opts || '[]'); } catch (e) {}
          var nameMap = {};
          opts.forEach(function (o) { nameMap[o.id] = o.name || String(o.id); });
          div.dataset.selected = JSON.stringify(ids || []);
          renderM2mTags(div, fname, opts, ids || [], nameMap, runServerOnchange);
          return;
        }
        var idSet = (ids || []).map(function (x) { return String(x); });
        form.querySelectorAll('input[name="' + fname + '_cb"]').forEach(function (cb) {
          cb.checked = idSet.indexOf(String(cb.value)) >= 0;
        });
      };

      if (isNew) {
        var action = _ctx.getActionForRoute(route);
        var context = (action && action.context) ? (typeof action.context === 'string' ? {} : action.context) : {};
        var fieldNames = fields.map(function (f) { return typeof f === 'object' ? f.name : f; });
        var applyDefaults = function (defaults) {
          if (!defaults || typeof defaults !== 'object') return;
          Object.keys(defaults).forEach(function (n) {
            var m2mInfo = getMany2manyInfo(model, n);
            var m2oComodel = getMany2oneComodel(model, n);
            if (m2mInfo) {
              setM2mChecked(n, Array.isArray(defaults[n]) ? defaults[n] : (defaults[n] ? [defaults[n]] : []));
            } else if (m2oComodel) {
              var widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
              if (widget) {
                var vEl = widget.querySelector('.m2one-value');
                var iEl = widget.querySelector('.m2one-input');
                var defId = defaults[n];
                if (vEl) vEl.value = defId != null ? String(defId) : '';
                if (iEl) {
                  if (defId) {
                    _ctx.rpc.callKw(m2oComodel, 'name_get', [[parseInt(defId, 10)]], {}).then(function (res) {
                      if (res && res[0]) { iEl.value = res[0][1]; iEl.dataset.display = res[0][1]; }
                    });
                  } else iEl.value = '';
                }
              }
            } else {
              var el = form.querySelector('[name="' + n + '"]');
              if (el) {
                if (el.type === 'checkbox') el.checked = !!defaults[n];
                else {
                  var metaD = getFieldMeta(model, n);
                  var dv = defaults[n];
                  if (metaD && metaD.type === 'date') el.value = serverValueToDateInput(dv);
                  else if (metaD && metaD.type === 'datetime') el.value = serverValueToDatetimeLocal(dv);
                  else el.value = dv != null ? String(dv) : '';
                }
              }
            }
          });
        };
        raceFormLoadRpc(_ctx.rpc.callKw(model, 'default_get', [fieldNames], { context: context }))
          .then(function (defaults) {
            applyDefaults(defaults);
            return loadOptions(defaults || {});
          })
          .then(function () { setupDependsOnHandlers(); setupOnchangeHandlers(); applyAttrsToForm(form, model); })
          .catch(function (err) {
            renderFormLoadFailure(formTitle, err, function () { renderForm(model, route, id); });
          });
        setupOne2manyAddButtons(form, model);
        setupOne2manyComputedFields(form, model);
        setupO2mOnchangeHandlers();
        form.onsubmit = function (e) { e.preventDefault(); createRecord(model, route, form); return false; };
      } else {
        loadRecord(model, id).then(function (r) {
          if (r && r[0]) {
            var rec = r[0];
            try {
              var key = 'erp_recent_items';
              var name = (rec.name || rec.display_name || 'Item').toString();
              var arr = [];
              try { arr = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (e) {}
              arr = arr.filter(function (x) { return !(x.route === route && x.id == id); });
              arr.unshift({ id: rec.id, name: name, route: route });
              sessionStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
            } catch (e) {}
            var curStack = _ctx.getActionStack();
            if (rec.name && curStack.length > 0) {
              curStack[curStack.length - 1].label = rec.name;
              _ctx.setActionStack(curStack);
              var bcNav = main.querySelector('.breadcrumbs');
              if (bcNav) bcNav.outerHTML = _ctx.renderBreadcrumbs();
              _ctx.attachBreadcrumbHandlers();
            }
            return loadOptions(rec).then(function () {
              setupDependsOnHandlers();
              setupOnchangeHandlers();
              applyAttrsToForm(form, model);
              var set = function (n, v) {
                var el = form.querySelector('[name="' + n + '"]');
                if (!el) return;
                var metaEl = getFieldMeta(model, n);
                if (metaEl && metaEl.type === 'date') { el.value = serverValueToDateInput(v); return; }
                if (metaEl && metaEl.type === 'datetime') { el.value = serverValueToDatetimeLocal(v); return; }
                el.value = v != null ? String(v) : '';
              };
              fields.forEach(function (f) {
                var n = typeof f === 'object' ? f.name : f;
                var o2m = getOne2manyInfo(model, n);
                var m2mInfo = getMany2manyInfo(model, n);
                if (m2mInfo) {
                  setM2mChecked(n, rec[n]);
                } else if (n === 'message_ids' && (model === 'crm.lead' || model === 'project.task' || model === 'helpdesk.ticket')) {
                  loadChatter(model, id, rec[n]);
                  setupChatter(form, model, id);
                } else if (o2m) {
                  var div = form.querySelector('#o2m-' + n);
                  var tbody = div && div.querySelector('#o2m-tbody-' + n);
                  if (tbody && rec[n] && Array.isArray(rec[n]) && rec[n].length) {
                    var lf2 = getOne2manyLineFields(model, n);
                    var o2mFields = ['id'].concat(lf2);
                    _ctx.rpc.callKw(o2m.comodel, 'search_read', [[['id', 'in', rec[n]]]], { fields: o2mFields })
                      .then(function (rows) {
                        var lf3 = getOne2manyLineFields(model, n);
                        rows.forEach(function (row) {
                          tbody.insertAdjacentHTML('beforeend', renderOne2manyRow(model, n, lf3, row, 0));
                        });
                        setupOne2manyAddButtons(form, model);
                        setupOne2manyComputedFields(form, model);
                        setupO2mOnchangeHandlers();
                      })
                      .catch(function () { if (tbody) tbody.innerHTML = '<tr><td colspan="4">—</td></tr>'; });
                  } else if (div) {
                    setupOne2manyAddButtons(form, model);
                    setupOne2manyComputedFields(form, model);
                    setupO2mOnchangeHandlers();
                  }
                } else if (isBooleanField(model, n)) {
                  var cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
                  if (cb) cb.checked = !!rec[n];
                } else if (isHtmlField(model, n)) {
                  var htmlDiv = document.getElementById('html-' + n);
                  var hiddenIn = document.getElementById('hidden-html-' + n);
                  var val = rec[n] || '';
                  if (htmlDiv) htmlDiv.innerHTML = val;
                  if (hiddenIn) hiddenIn.value = val;
                } else if (isImageField(model, n)) {
                  var imgPreview = document.getElementById('img-preview-' + n);
                  var statusSpan = document.getElementById('bin-status-' + n);
                  var hiddenIn2 = form.querySelector('[name="' + n + '"]');
                  if (rec[n] && imgPreview) {
                    imgPreview.src = 'data:image/png;base64,' + rec[n];
                    imgPreview.style.display = 'block';
                  }
                  if (statusSpan && rec[n]) statusSpan.textContent = 'Image attached';
                } else if (isBinaryField(model, n)) {
                  var statusSpanB = document.getElementById('bin-status-' + n);
                  if (statusSpanB && rec[n]) statusSpanB.textContent = 'File attached';
                } else if (getMany2oneComodel(model, n)) {
                  var widget = form.querySelector('.m2one-widget[data-fname="' + n + '"]');
                  if (widget) {
                    var vEl = widget.querySelector('.m2one-value');
                    var iEl = widget.querySelector('.m2one-input');
                    var recId = rec[n];
                    if (vEl) vEl.value = recId != null ? String(recId) : '';
                    if (iEl) {
                      var display = rec[n + '_display'];
                      if (display) {
                        iEl.value = display;
                        iEl.dataset.display = display;
                      } else if (recId) {
                        _ctx.rpc.callKw(getMany2oneComodel(model, n), 'name_get', [[parseInt(recId, 10)]], {}).then(function (res) {
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
          } else {
            renderFormLoadFailure(formTitle, new Error('Record not found'), function () { renderForm(model, route, id); });
          }
        }).catch(function (err) {
          renderFormLoadFailure(formTitle, err, function () { renderForm(model, route, id); });
        });
        form.onsubmit = function (e) { e.preventDefault(); updateRecord(model, route, id, form); return false; };
        var btnDup = document.getElementById('btn-duplicate');
        var btnDel = document.getElementById('btn-delete-form');
        if (btnDup) btnDup.onclick = function () {
          _ctx.rpc.callKw(model, 'copy', [[parseInt(id, 10)]], {})
            .then(function (newRec) {
              var newId = typeof newRec === 'number' ? newRec : ((newRec && newRec.ids && newRec.ids[0]) || (newRec && newRec.id));
              if (newId) {
                _ctx.showToast('Record duplicated', 'success');
                window.location.hash = route + '/edit/' + newId;
              }
            })
            .catch(function (err) { _ctx.showToast(err.message || 'Failed to duplicate', 'error'); });
        };
        if (btnDel) btnDel.onclick = function (e) {
          e.preventDefault();
          confirmModal({ title: 'Delete record', message: 'Delete this record?', confirmLabel: 'Delete', cancelLabel: 'Cancel' }).then(function (ok) {
            if (ok && _ctx.deleteRecord) _ctx.deleteRecord(model, route, id);
          });
        };
        var suggestionsEl = document.getElementById('ai-suggestions-list');
        if (suggestionsEl) {
          fetch('/ai/chat', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'suggest_next_actions', kwargs: { model: model, record_id: parseInt(id, 10) } })
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (data.error) { suggestionsEl.innerHTML = '<span style="color:var(--text-muted)">' + (data.error || 'Unable to load').replace(/</g, '&lt;') + '</span>'; return; }
              var suggestions = data.result || [];
              if (!Array.isArray(suggestions)) suggestions = [];
              if (!suggestions.length) { suggestionsEl.innerHTML = '<span style="color:var(--text-muted)">No suggestions</span>'; return; }
              var html = '<ul style="list-style:none;padding:0;margin:0">';
              suggestions.forEach(function (s) {
                html += '<li style="padding:0.35rem 0;border-bottom:1px solid var(--border-color)">' + (s.label || s.action || '').replace(/</g, '&lt;') + '</li>';
              });
              html += '</ul>';
              suggestionsEl.innerHTML = html;
            })
            .catch(function () { var el = document.getElementById('ai-suggestions-list'); if (el) el.innerHTML = '<span style="color:var(--text-muted)">Could not load</span>'; });
        }
      }

      var btnAiFill = document.getElementById('btn-ai-fill');
      if (btnAiFill) {
        btnAiFill.onclick = function () {
          var text = prompt('Paste text (email, signature, lead description, etc.) to extract fields:');
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
              if (data.error) { _ctx.showToast(data.error || 'AI extract failed', 'error'); return; }
              var aiFields = data.fields || {};
              var aiForm = document.getElementById('record-form');
              if (!aiForm) return;
              Object.keys(aiFields).forEach(function (fname) {
                var val = aiFields[fname];
                if (val == null) return;
                var strVal = String(val);
                var el = aiForm.querySelector('[name="' + fname + '"]');
                if (el) {
                  if (el.tagName === 'TEXTAREA') el.value = strVal;
                  else if (el.type === 'checkbox') el.checked = !!val;
                  else el.value = strVal;
                }
                var htmlDiv = document.getElementById('html-' + fname);
                var hiddenHtml = document.getElementById('hidden-html-' + fname);
                if (htmlDiv && hiddenHtml) { htmlDiv.innerHTML = strVal; hiddenHtml.value = strVal; }
              });
              _ctx.setFormDirty(true);
              updateDirtyBanner();
              _ctx.showToast('Fields filled from AI extraction', 'success');
            })
            .catch(function (err) { _ctx.showToast(err.message || 'AI extract failed', 'error'); })
            .finally(function () { btnAiFill.disabled = false; btnAiFill.textContent = 'AI Fill'; });
        };
      }
      setupSignatureWidgets(form);
      _ctx.attachBreadcrumbHandlers();
    }
    /* ── end wireFormViewAfterPaint ───────────── */

    if (window.AppCore && window.AppCore.FormViewModule && typeof window.AppCore.FormViewModule.render === 'function') {
      if (window.AppCore.FormViewModule.render(_ctx.main, {
        model: model,
        route: route,
        id: id,
        isNew: isNew,
        renderBreadcrumbs: _ctx.renderBreadcrumbs,
        getTitle: _ctx.getTitle,
        getReportName: _ctx.getReportName,
        skeletonHtml: _ctx.skeletonHtml,
        buildInnerHtml: function () {
          var inner = '';
          if (children && children.length) {
            inner += renderFormTreeToHtml(model, children, { recordId: id, route: route, isNew: isNew });
          } else {
            fields.forEach(function (f) {
              var fname = typeof f === 'object' ? f.name : f;
              inner += '<div class="attr-field" data-fname="' + (fname || '') + '">' + renderFieldHtml(model, f) + '</div>';
            });
          }
          return inner;
        },
        wireForm: wireFormViewAfterPaint,
      })) {
        return;
      }
    }
    _ctx.main.innerHTML = '<p class="o-empty">Form view unavailable.</p>';
  }

  /* ──────────────────────────────────────────────
   * 37. getFormVals
   * ────────────────────────────────────────────── */
  function getFormVals(form, model) {
    form.querySelectorAll('.html-widget').forEach(function (div) {
      var fname = div.dataset.fname;
      var hidden = document.getElementById('hidden-html-' + fname);
      if (hidden) hidden.value = div.innerHTML || '';
    });
    var fields = _ctx.getFormFields(model);
    var byName = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    var vals = {};
    fields.forEach(function (f) {
      var n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      var o2m = getOne2manyInfo(model, n);
      if (o2m) {
        var tbody = form.querySelector('#o2m-tbody-' + n);
        if (tbody) {
          var lineFields = getOne2manyLineFields(model, n);
          var rows = [];
          tbody.querySelectorAll('tr').forEach(function (tr) {
            var row = {};
            var rowId = tr.getAttribute('data-o2m-id');
            if (rowId) row.id = parseInt(rowId, 10);
            lineFields.forEach(function (lf) {
              var inp = tr.querySelector('[data-o2m-field="' + lf + '"]');
              if (!inp) return;
              var v = inp.value || (lf === 'date_deadline' ? null : '');
              if (lf === 'product_id' && /^\d+$/.test(String(v))) v = parseInt(v, 10);
              else if (['product_uom_qty', 'price_unit', 'price_subtotal', 'product_qty', 'unit_amount', 'quantity', 'total_amount'].indexOf(lf) >= 0 && v !== '') v = parseFloat(v) || 0;
              row[lf] = v;
            });
            if (lineFields.length) rows.push(row);
          });
          vals[n] = rows;
        }
        return;
      }
      var m2m = getMany2manyInfo(model, n);
      if (m2m) {
        var tagsDiv = form.querySelector('#m2m-' + n + '[data-widget="many2many_tags"]');
        if (tagsDiv && tagsDiv.dataset.selected) {
          try { vals[n] = JSON.parse(tagsDiv.dataset.selected || '[]'); } catch (e) { vals[n] = []; }
        } else {
          var ids = [];
          form.querySelectorAll('input[name="' + n + '_cb"]:checked').forEach(function (cb) { ids.push(parseInt(cb.value, 10)); });
          vals[n] = ids;
        }
        return;
      }
      if (isBooleanField(model, n)) {
        var cb = form.querySelector('[name="' + n + '"][type="checkbox"]');
        vals[n] = cb ? !!cb.checked : false;
        return;
      }
      if (isBinaryField(model, n) || isImageField(model, n)) {
        var v = byName(n);
        if (v) vals[n] = v;
        return;
      }
      if (isHtmlField(model, n)) {
        vals[n] = byName(n);
        return;
      }
      var metaFr = getFieldMeta(model, n);
      if (metaFr && metaFr.type === 'date') {
        vals[n] = dateInputToServer(byName(n));
        return;
      }
      if (metaFr && metaFr.type === 'datetime') {
        vals[n] = datetimeLocalToServer(byName(n));
        return;
      }
      var sv = byName(n).trim();
      var comodel = getMany2oneComodel(model, n);
      var selectionOpts = getSelectionOptions(model, n);
      if (comodel) {
        vals[n] = sv ? parseInt(sv, 10) : null;
      } else if (selectionOpts) {
        vals[n] = sv || (selectionOpts[0] ? selectionOpts[0][0] : null);
      } else {
        vals[n] = sv;
      }
    });
    return vals;
  }

  /* ──────────────────────────────────────────────
   * 38. showFormError
   * ────────────────────────────────────────────── */
  function showFormError(form, msg) {
    var prev = form.querySelector('.error');
    if (prev) prev.remove();
    form.insertAdjacentHTML('beforeend', '<p class="error" style="color:#c00;margin-top:0.5rem">' + msg.replace(/</g, '&lt;') + '</p>');
  }

  /* ──────────────────────────────────────────────
   * 39. clearFieldErrors
   * ────────────────────────────────────────────── */
  function clearFieldErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('field-error'); });
    form.querySelectorAll('.field-error-msg').forEach(function (el) { el.remove(); });
  }

  /* ──────────────────────────────────────────────
   * 40. showFieldError
   * ────────────────────────────────────────────── */
  function showFieldError(form, fname, msg) {
    var wrapper = form.querySelector('[data-fname="' + fname + '"]');
    if (!wrapper) return;
    wrapper.classList.add('field-error');
    var prev = wrapper.querySelector('.field-error-msg');
    if (prev) prev.remove();
    var errEl = document.createElement('span');
    errEl.className = 'field-error-msg';
    errEl.textContent = msg || 'Invalid';
    wrapper.appendChild(errEl);
  }

  /* ──────────────────────────────────────────────
   * 41. validateRequiredFields
   * ────────────────────────────────────────────── */
  function validateRequiredFields(form, model) {
    var fields = _ctx.getFormFields(model);
    var formVals = getFormVals(form, model);
    var errors = [];
    fields.forEach(function (f) {
      var n = typeof f === 'object' ? f.name : f;
      if (n === 'message_ids') return;
      var meta = getFieldMeta(model, n);
      var required = (meta && meta.required) || n === 'name';
      if (!required) return;
      var v = formVals[n];
      var empty = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
      if (empty) errors.push({ fname: n, msg: (meta && meta.string) ? meta.string + ' is required' : n + ' is required' });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  /* ──────────────────────────────────────────────
   * 42. setupFormDirtyTracking
   * ────────────────────────────────────────────── */
  function setupFormDirtyTracking(form) {
    _ctx.setFormDirty(false);
    var markDirty = function () { _ctx.setFormDirty(true); updateDirtyBanner(); };
    form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(function (el) {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });
  }

  /* ──────────────────────────────────────────────
   * 43. setupSignatureWidgets
   * ────────────────────────────────────────────── */
  function setupSignatureWidgets(form) {
    if (!form) return;
    form.querySelectorAll('.o-signature-canvas').forEach(function (canvas) {
      var wrap = canvas.closest('.o-signature-widget');
      if (!wrap) return;
      var hidden = wrap.querySelector('.o-signature-data');
      if (!hidden) return;
      var ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = typeof getComputedStyle !== 'undefined' ? (getComputedStyle(document.documentElement).getPropertyValue('--color-text') || '#333').trim() || '#333' : '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
      var drawing = false;
      function pos(e) {
        var r = canvas.getBoundingClientRect();
        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - r.left, y: cy - r.top };
      }
      function start(e) {
        drawing = true;
        var p = pos(e);
        if (ctx) { ctx.beginPath(); ctx.moveTo(p.x, p.y); }
        if (e.cancelable) e.preventDefault();
      }
      function move(e) {
        if (!drawing || !ctx) return;
        var p = pos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        hidden.value = canvas.toDataURL('image/png');
        if (e.cancelable) e.preventDefault();
      }
      function end() { drawing = false; }
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('mouseleave', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);
      var clearBtn = wrap.querySelector('.o-signature-clear');
      if (clearBtn) {
        clearBtn.onclick = function () {
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          hidden.value = '';
        };
      }
    });
  }

  /* ──────────────────────────────────────────────
   * 44. updateDirtyBanner
   * ────────────────────────────────────────────── */
  function updateDirtyBanner() {
    var banner = document.getElementById('form-dirty-banner');
    if (!banner) return;
    banner.style.display = _ctx.getFormDirty() ? 'block' : 'none';
  }

  /* ──────────────────────────────────────────────
   * 45. handleSaveError
   * ────────────────────────────────────────────── */
  function handleSaveError(form, model, err, btn) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
    if ((err.message || '').indexOf('Session expired') >= 0) { window.location.href = '/web/login'; return; }
    _ctx.showToast(err.message || 'Failed to save', 'error');
    clearFieldErrors(form);
    showFormError(form, err.message || 'Failed to save');
    var msg = (err.message || '').toLowerCase();
    var fields = _ctx.getFormFields(model || []);
    (fields || []).forEach(function (f) {
      var n = typeof f === 'object' ? f.name : f;
      if (n && msg.indexOf(n.toLowerCase()) >= 0) showFieldError(form, n, err.message || 'Invalid');
    });
  }

  /* ──────────────────────────────────────────────
   * 46. createRecord
   * ────────────────────────────────────────────── */
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
    var vals = getFormVals(form, model);
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    _ctx.rpc.callKw(model, 'create', [[vals]])
      .then(function () {
        _ctx.setFormDirty(false);
        _ctx.showToast('Record created', 'success');
        window.location.hash = route;
        _ctx.dispatchActWindowForListRoute(route, { source: 'formSaveReturnList' });
        _ctx.loadRecords(model, route, _ctx.getCurrentListState().searchTerm);
      })
      .catch(function (err) { handleSaveError(form, model, err, btn); });
  }

  /* ──────────────────────────────────────────────
   * 47. updateRecord
   * ────────────────────────────────────────────── */
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
    var vals = getFormVals(form, model);
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    _ctx.rpc.callKw(model, 'write', [[parseInt(id, 10)], vals])
      .then(function () {
        _ctx.setFormDirty(false);
        _ctx.showToast('Record saved', 'success');
        window.location.hash = route;
        _ctx.dispatchActWindowForListRoute(route, { source: 'formSaveReturnList' });
        _ctx.loadRecords(model, route, _ctx.getCurrentListState().searchTerm);
      })
      .catch(function (err) { handleSaveError(form, model, err, btn); });
  }

  /* ──────────────────────────────────────────────
   * 48. loadRecord
   * ────────────────────────────────────────────── */
  function loadRecord(model, id) {
    var fields = _ctx.getFormFields(model);
    var fnames = fields.map(function (f) { return typeof f === 'object' ? f.name : f; });
    return raceFormLoadRpc(_ctx.rpc.callKw(model, 'read', [[parseInt(id, 10)], fnames]));
  }

  /* ──────────────────────────────────────────────
   * Public API – expose all 48 functions
   * ────────────────────────────────────────────── */
  FV.getViewFieldDef = getViewFieldDef;
  FV.getFieldMeta = getFieldMeta;
  FV.getMany2oneComodel = getMany2oneComodel;
  FV.getMany2oneDomain = getMany2oneDomain;
  FV.getSelectionOptions = getSelectionOptions;
  FV.isBooleanField = isBooleanField;
  FV.isMonetaryField = isMonetaryField;
  FV.getMonetaryCurrencyField = getMonetaryCurrencyField;
  FV.pad2 = pad2;
  FV.serverValueToDateInput = serverValueToDateInput;
  FV.serverValueToDatetimeLocal = serverValueToDatetimeLocal;
  FV.dateInputToServer = dateInputToServer;
  FV.datetimeLocalToServer = datetimeLocalToServer;
  FV.confirmModal = confirmModal;
  FV.isBinaryField = isBinaryField;
  FV.isHtmlField = isHtmlField;
  FV.isImageField = isImageField;
  FV.getSelectionLabel = getSelectionLabel;
  FV.getOne2manyInfo = getOne2manyInfo;
  FV.getOne2manyFieldInputType = getOne2manyFieldInputType;
  FV.renderOne2manyRow = renderOne2manyRow;
  FV.setupOne2manyAddButtons = setupOne2manyAddButtons;
  FV.setupOne2manyComputedFields = setupOne2manyComputedFields;
  FV.loadChatter = loadChatter;
  FV.setupChatter = setupChatter;
  FV.getOne2manyLineFields = getOne2manyLineFields;
  FV.getMany2manyInfo = getMany2manyInfo;
  FV.getFieldLabel = getFieldLabel;
  FV.isTextField = isTextField;
  FV.parseDomain = parseDomain;
  FV.evaluateDomain = evaluateDomain;
  FV.evaluateCondition = evaluateCondition;
  FV.applyAttrsToForm = applyAttrsToForm;
  FV.renderFieldHtml = renderFieldHtml;
  FV.renderFormTreeToHtml = renderFormTreeToHtml;
  FV.renderForm = renderForm;
  FV.getFormVals = getFormVals;
  FV.showFormError = showFormError;
  FV.clearFieldErrors = clearFieldErrors;
  FV.showFieldError = showFieldError;
  FV.validateRequiredFields = validateRequiredFields;
  FV.setupFormDirtyTracking = setupFormDirtyTracking;
  FV.setupSignatureWidgets = setupSignatureWidgets;
  FV.updateDirtyBanner = updateDirtyBanner;
  FV.handleSaveError = handleSaveError;
  FV.createRecord = createRecord;
  FV.updateRecord = updateRecord;
  FV.loadRecord = loadRecord;

  window.__ERP_FORM_VIEWS = FV;
})();
