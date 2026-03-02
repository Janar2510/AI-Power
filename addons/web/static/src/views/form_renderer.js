/**
 * Form view renderer - skeleton for form view
 * Odoo parity: form view with fields from view def
 */
(function () {
  window.ViewRenderers = window.ViewRenderers || {};
  window.ViewRenderers.form = {
    render(container, viewDef, record) {
      const fields = (viewDef && viewDef.fields) || ['name'];
      const data = record || {};
      let html = '<form style="max-width:400px">';
      fields.forEach(f => {
        const name = typeof f === 'string' ? f : (f.name || f);
        const label = (typeof f === 'object' && f.string) || name;
        const val = data[name] != null ? String(data[name]) : '';
        html += '<p><label>' + label.replace(/</g, '&lt;') + '<br><input type="text" name="' + name + '" value="' + val.replace(/"/g, '&quot;') + '" style="width:100%;padding:0.5rem;margin-top:0.25rem"></label></p>';
      });
      html += '</form>';
      container.innerHTML = html;
    }
  };
})();
