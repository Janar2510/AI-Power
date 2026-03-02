/**
 * List view renderer - skeleton for list view
 * Odoo parity: list view with columns from view def
 */
(function () {
  window.ViewRenderers = window.ViewRenderers || {};
  window.ViewRenderers.list = {
    render(container, viewDef, data) {
      const cols = (viewDef && viewDef.columns) || (viewDef && viewDef.fields) || ['name', 'id'];
      const records = data || [];
      let html = '<table role="grid" style="width:100%;border-collapse:collapse"><thead><tr>';
      cols.forEach(c => {
        const field = typeof c === 'string' ? c : (c.name || c);
        html += '<th style="text-align:left;padding:0.5rem;border-bottom:1px solid #ddd">' + (field || '').replace(/</g, '&lt;') + '</th>';
      });
      html += '<th></th></tr></thead><tbody>';
      records.forEach(r => {
        html += '<tr data-id="' + (r.id || '') + '">';
        cols.forEach(c => {
          const field = typeof c === 'string' ? c : (c.name || c);
          const val = r[field] != null ? String(r[field]) : '';
          html += '<td style="padding:0.5rem;border-bottom:1px solid #eee">' + val.replace(/</g, '&lt;') + '</td>';
        });
        html += '<td style="padding:0.5rem"></td></tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }
  };
})();
