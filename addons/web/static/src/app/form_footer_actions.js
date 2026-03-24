/**
 * Phase 567: form footer action strip (Save / Cancel / duplicate / print / delete) — modular HTML
 * boundary; legacy renderForm delegates when AppCore.FormFooterActions is registered.
 */

function escHashRoute(route) {
  return String(route == null ? "" : route)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function buildFormFooterActionsHtml(options) {
  var route = options.route || "";
  var isNew = !!options.isNew;
  var model = options.model || "";
  var reportName = options.reportName || null;
  var id = options.recordId;
  var html = '<p class="o-form-footer-actions">';
  html +=
    '<button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
  html +=
    '<a href="#' + escHashRoute(route) + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
  if (isNew && (model === "crm.lead" || model === "res.partner")) {
    html +=
      ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
  }
  if (!isNew) {
    html +=
      ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
    if (reportName) {
      html +=
        ' <a href="/report/html/' +
        encodeURIComponent(String(reportName)) +
        "/" +
        encodeURIComponent(String(id)) +
        '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
      html +=
        ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
    }
    html +=
      ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
  }
  html += "</p>";
  return html;
}
