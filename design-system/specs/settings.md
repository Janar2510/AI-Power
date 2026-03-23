# Settings — UI specification

Inherits [foundations.md](./foundations.md) and [app-shell.md](./app-shell.md).

Enterprise settings area: index (card grid + nav) and sub-pages (breadcrumbs + focused forms/tables). All surfaces use CSS custom properties only; spacing uses `--space-*` and `--card-gap`.

## Settings index

- **Shell:** `.o-settings-shell` — vertical flex, max-width token, gap between intro and stack.
- **Intro:** Single paragraph (`.o-settings-intro`) below page title `h2`.
- **Stack:** `.o-settings-stack` — column flex, `gap: var(--card-gap)`.
- **Section cards:** Each block (General, System Parameters, AI Configuration, Outgoing Mail Servers) is a **primary card** with animated gradient border via `UIComponents.SettingsSection` → `UIComponents.Card` (`gradient: true`).
  - **Header:** Card title (h3 equivalent in `.o-card-header`).
  - **Body:** Slot for dynamic content (forms, tables).
  - **Accessibility:** `aria-label` on the `<section>` summarizing the block (e.g. “General settings”).
- **Nav links:** Hash routes to sub-pages. Use anchor elements with `.o-btn.o-btn-secondary.o-settings-nav-link` (same visual weight as secondary `UIComponents.Button`), full-width row, `border-radius: var(--radius-sm)`, no hardcoded colors.

## Sub-page layout (widgets, API keys, TOTP)

- **Breadcrumbs:** Injected as first children of `#main` (or passed HTML string parsed into a wrapper `.o-settings-breadcrumbs`). Existing `data-bc-idx` behaviour unchanged; `main.js` calls `attachBreadcrumbHandlers()` after render.
- **Content root:** `.o-settings-subpage` — max-width `32rem` where a single form column is appropriate; tables may use `.o-settings-table-wrap` for horizontal scroll on small viewports.
- **Title:** `h2` + optional description paragraph using `var(--text-muted)` for secondary copy.

## Field components (`.o-settings-field`)

- **Structure:** Label (`.o-settings-field-label`) + control wrapper (`.o-settings-field-control`).
- **Inputs:** `.o-settings-input` — border `var(--border-color)`, radius `var(--radius-sm)`, padding `var(--space-sm)`. `:focus-visible` outline uses design tokens.
- **Select:** Same classes as text inputs where applicable.
- **Toggle (checkbox + label):** `.o-settings-toggle` — flex row, `gap: var(--space-sm)`, label text in `.o-settings-toggle-label`.
- **Password:** `.o-settings-password` — input + `.o-settings-password-toggle` button; `aria-label` toggles between “Show password” / “Hide password”.

Factory: `UIComponents.SettingsField` (text, password+toggle, select, toggle row).

## Table components (`.o-settings-table`)

- **Base:** Full width inside card; `border-collapse: collapse`; header cells bottom border `var(--border-color)`; body cells padding `var(--space-sm)`.
- **Editable cells:** Inputs use `.o-settings-input` (no inline `style=`).
- **Actions column:** Primary action uses `.o-btn.o-btn-primary` (small/dense variant via modifier class if needed). Destructive actions use `.o-btn.o-btn-danger` or link styled with `color: var(--color-danger)` and `border-color: var(--color-danger)` where outlined.

Helper: `UIComponents.SettingsTable.create(parent, columnLabels)` → `{ table, tbody }`.

## Responsive

- **≤1023px:** Stack unchanged; table wrap allows horizontal scroll if needed.
- **≤768px:** Settings stack single column; nav links remain full width.
- **≤480px:** Reduce horizontal padding via shell tokens only (no fixed pixel gutters for “theme” colors).

## Dark mode

- All colors from `var(--*)` tokens inherited from `webclient.css`. No `#rgb` / `#rrggbb` in new settings CSS except where tokens are defined at `:root` / `[data-theme="dark"]`.
- Settings should read as a high-trust administration surface with stronger sheet clarity than the dashboard but shared shell materials.

## Accessibility

- Section cards: `aria-label` on the card root.
- Icon-only controls: `aria-label` (password toggle).
- Tables: `<th>` text sufficient for column purpose; destructive actions also confirmed with `confirm()` where already present in behaviour.

## RPC / behaviour (reference)

- Index: `res.company`, `ir.config_parameter`, `ir.mail_server` — same calls as legacy `main.js`.
- Dashboard widgets: `ir.dashboard.widget` CRUD.
- API keys: `session.getSessionInfo` + `res.users.apikeys`.
- TOTP: `fetch` `/web/totp/*` + optional `QRCode` global.
