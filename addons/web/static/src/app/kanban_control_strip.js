/**
 * Phase 575: kanban list chrome (title + toolbar row) — modular boundary above #kanban-area.
 */

function escAttr(v) {
  return String(v == null ? "" : v).replace(/"/g, "&quot;");
}

function escHtml(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.viewSwitcherHtml]
 * @param {string} [opts.searchTerm]
 * @param {string} opts.addLabel
 * @param {string} [opts.middleSlotHtml] e.g. stage filter <select>
 */
export function buildKanbanChromeHtml(opts) {
  const title = opts.title || "";
  const vs = opts.viewSwitcherHtml || "";
  const st = opts.searchTerm || "";
  const addLabel = opts.addLabel || "Add";
  const mid = opts.middleSlotHtml || "";
  let html = "<h2>" + escHtml(title) + "</h2>";
  html +=
    '<p class="o-kanban-control-strip" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
  html += vs;
  html +=
    '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);min-width:200px" value="' +
    escAttr(st) +
    '">';
  html +=
    '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
  html += mid;
  html +=
    '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' +
    escHtml(addLabel) +
    "</button></p>";
  html += '<div id="kanban-area"></div>';
  return html;
}
