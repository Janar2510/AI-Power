/**
 * Phase 603: Kanban card body chrome — tokenized shell + field strip (kanban-view.md).
 * Legacy kanban_renderer delegates when AppCore.KanbanCardChrome is registered (modern bundle).
 */

function escAttr(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function escHtml(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/**
 * @param {object} record
 * @param {{ onStageChange?: function, fields?: string[], cardTemplate?: function }} options
 * @returns {string} full card HTML (outer .kanban-card for existing wire-up)
 */
export function buildKanbanCardHtml(record, options) {
  const opts = options || {};
  const fields = Array.isArray(opts.fields) ? opts.fields : ["name", "expected_revenue", "date_deadline"];
  const draggable = opts.onStageChange ? ' draggable="true"' : "";
  const rid = record && record.id != null ? String(record.id) : "";
  const name = (record && record.name != null ? record.name : "—").replace(/</g, "&lt;");

  let html =
    '<div class="kanban-card o-kanban-card o-card-gradient" data-id="' +
    escAttr(rid) +
    '"' +
    draggable +
    ">";
  html +=
    '<div class="o-kanban-card-head"><label class="o-kanban-card-select-row">' +
    '<input type="checkbox" class="kanban-select" data-id="' +
    escAttr(rid) +
    '">' +
    '<strong class="o-kanban-card-title">' +
    name +
    "</strong></label></div>";
  html += '<div class="o-kanban-card-body">';
  if (typeof opts.cardTemplate === "function") {
    html +=
      '<div class="kanban-template">' + String(opts.cardTemplate(record) || "") + "</div>";
  }
  fields.forEach(function (fname) {
    if (fname === "name") return;
    const v = record[fname];
    if (v == null || v === "") return;
    let disp = v;
    if (Array.isArray(disp) && disp.length) disp = disp[1] != null ? disp[1] : disp[0];
    html +=
      '<div class="o-kanban-card-field" data-field="' +
      escAttr(fname) +
      '"><span class="o-kanban-card-field-value">' +
      escHtml(disp) +
      "</span></div>";
  });
  html += "</div></div>";
  return html;
}
