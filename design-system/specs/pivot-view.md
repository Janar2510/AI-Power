# Pivot view

## Scope

- **Phase 614:** Legacy pivot in `main.js` delegates the **toolbar** (view switcher, flip axes, CSV download, search, CRM stage, add) to **`AppCore.PivotViewChrome.buildToolbarHtml`** (`app/pivot_view_chrome.js`).
- Pivot **table** uses classes **`.o-pivot-table`**, **`.o-pivot-th`**, **`.o-pivot-td`** with spacing/borders from **`webclient.css`** (tokens only).

## Behaviour

- **Flip axes** swaps row/column dimensions in the existing matrix renderer.
- **Download CSV** exports the current pivot grid.

## Acceptance

- Toolbar buttons use **`var(--border-color)`**, **`var(--color-surface-1)`**, list-toolbar button patterns — no **`#ddd`** / **`#1a1a2e`** on the chrome path.
