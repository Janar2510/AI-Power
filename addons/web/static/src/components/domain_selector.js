/**
 * Domain Selector — visual domain expression editor for advanced filters.
 * Mirrors Odoo 19's core/domain_selector pattern.
 *
 * Renders a structured UI: field picker, operator selector, value input.
 * Produces Odoo-style domain arrays: [['field','op','value'], ...]
 *
 * Phase 1.245 Track E4.
 */
(function () {
  var OPERATORS = [
    { value: '=',         label: 'equals' },
    { value: '!=',        label: 'not equals' },
    { value: '>',         label: 'greater than' },
    { value: '>=',        label: 'greater or equal' },
    { value: '<',         label: 'less than' },
    { value: '<=',        label: 'less or equal' },
    { value: 'like',      label: 'contains' },
    { value: 'not like',  label: 'does not contain' },
    { value: 'ilike',     label: 'contains (case-insensitive)' },
    { value: 'in',        label: 'in' },
    { value: 'not in',    label: 'not in' },
    { value: '=?',        label: 'is set' },
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function _buildFieldOptions(fields) {
    if (!fields || typeof fields !== 'object') return '';
    var html = '<option value="">— field —</option>';
    var names = Object.keys(fields).sort();
    for (var i = 0; i < names.length; i++) {
      var fname = names[i];
      var fmeta = fields[fname];
      var label = (fmeta && fmeta.string) || fname;
      html += '<option value="' + esc(fname) + '">' + esc(label) + '</option>';
    }
    return html;
  }

  function _buildOperatorOptions() {
    var html = '';
    for (var i = 0; i < OPERATORS.length; i++) {
      html += '<option value="' + esc(OPERATORS[i].value) + '">' + esc(OPERATORS[i].label) + '</option>';
    }
    return html;
  }

  function _createRowHtml(fields, condition) {
    var cond = condition || {};
    var fieldOpts = _buildFieldOptions(fields);
    var opOpts = _buildOperatorOptions();
    return (
      '<div class="o-domain-row" style="display:flex;gap:var(--space-sm);align-items:center;margin-bottom:var(--space-sm)">' +
        '<select class="o-domain-field" style="flex:1;padding:var(--space-xs) var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
          fieldOpts +
        '</select>' +
        '<select class="o-domain-op" style="width:10rem;padding:var(--space-xs) var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
          opOpts +
        '</select>' +
        '<input type="text" class="o-domain-value" placeholder="Value" value="' + esc(cond.value || '') + '" style="flex:1;padding:var(--space-xs) var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)">' +
        '<button type="button" class="o-domain-remove o-btn o-btn-secondary" style="padding:var(--space-xs) var(--space-sm);font-size:0.85rem" title="Remove condition">×</button>' +
      '</div>'
    );
  }

  function _readDomainFromContainer(container) {
    var rows = container.querySelectorAll('.o-domain-row');
    var domain = [];
    for (var i = 0; i < rows.length; i++) {
      var fieldEl = rows[i].querySelector('.o-domain-field');
      var opEl = rows[i].querySelector('.o-domain-op');
      var valEl = rows[i].querySelector('.o-domain-value');
      var field = fieldEl ? fieldEl.value : '';
      var op = opEl ? opEl.value : '=';
      var rawVal = valEl ? valEl.value : '';
      if (!field) continue;
      var val = rawVal;
      if (rawVal === 'true') val = true;
      else if (rawVal === 'false') val = false;
      else if (rawVal !== '' && !isNaN(Number(rawVal))) val = Number(rawVal);
      domain.push([field, op, val]);
    }
    return domain;
  }

  /**
   * Render domain selector into a container element.
   * @param {HTMLElement} container
   * @param {Object} options
   * @param {Object} options.fields   — { fieldName: { string, type, ... }, ... }
   * @param {Array}  [options.domain] — initial domain array
   * @param {Function} [options.onChange] — called with new domain after each edit
   */
  function render(container, options) {
    var opts = options || {};
    var fields = opts.fields || {};
    var initial = opts.domain || [];
    var onChange = opts.onChange || function () {};

    var wrapper = document.createElement('div');
    wrapper.className = 'o-domain-selector';
    wrapper.style.cssText = 'padding:var(--space-sm);border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--color-surface-1)';

    var rowsContainer = document.createElement('div');
    rowsContainer.className = 'o-domain-rows';

    if (initial.length) {
      for (var i = 0; i < initial.length; i++) {
        var cond = initial[i];
        if (Array.isArray(cond) && cond.length >= 3) {
          rowsContainer.insertAdjacentHTML('beforeend', _createRowHtml(fields, { field: cond[0], op: cond[1], value: cond[2] }));
          var lastRow = rowsContainer.lastElementChild;
          if (lastRow) {
            var fSel = lastRow.querySelector('.o-domain-field');
            var oSel = lastRow.querySelector('.o-domain-op');
            if (fSel) fSel.value = cond[0];
            if (oSel) oSel.value = cond[1];
          }
        }
      }
    }

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'o-btn o-btn-secondary';
    addBtn.textContent = '+ Add condition';
    addBtn.style.cssText = 'margin-top:var(--space-sm);font-size:0.85rem';

    wrapper.appendChild(rowsContainer);
    wrapper.appendChild(addBtn);
    container.innerHTML = '';
    container.appendChild(wrapper);

    function fireChange() {
      onChange(_readDomainFromContainer(rowsContainer));
    }

    addBtn.addEventListener('click', function () {
      rowsContainer.insertAdjacentHTML('beforeend', _createRowHtml(fields));
      fireChange();
    });

    wrapper.addEventListener('click', function (e) {
      if (e.target.classList.contains('o-domain-remove')) {
        var row = e.target.closest('.o-domain-row');
        if (row) row.remove();
        fireChange();
      }
    });

    wrapper.addEventListener('change', fireChange);
    wrapper.addEventListener('input', function (e) {
      if (e.target.classList.contains('o-domain-value')) fireChange();
    });

    return {
      getDomain: function () { return _readDomainFromContainer(rowsContainer); },
      setFields: function (newFields) {
        fields = newFields || {};
        var rows = rowsContainer.querySelectorAll('.o-domain-row');
        var optsHtml = _buildFieldOptions(fields);
        for (var j = 0; j < rows.length; j++) {
          var fSel = rows[j].querySelector('.o-domain-field');
          var current = fSel ? fSel.value : '';
          if (fSel) { fSel.innerHTML = optsHtml; fSel.value = current; }
        }
      },
      destroy: function () { container.innerHTML = ''; },
    };
  }

  window.DomainSelector = { render: render, OPERATORS: OPERATORS };
})();
