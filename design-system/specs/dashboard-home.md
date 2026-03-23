# Dashboard & Home — Component spec

**Surface:** `#home` / default route (`renderHome` → dashboard).  
**Implements:** B2B ERP home; executive, data-dense (per [MASTER.md](../MASTER.md)).
**Inherits:** [foundations.md](./foundations.md) and [app-shell.md](./app-shell.md).

---

## Layout grid

- **Root:** `.o-dashboard-root` — vertical stack with `gap: var(--card-gap)`.
- **Header row:** `.o-dashboard-header` — flex; title (`.o-dashboard-title`) + actions (Customize uses `UIComponents.Button`, `kind: secondary`).
- **Main grid:** `.o-dashboard-grid` — CSS Grid:
  - **Desktop** (`> 1023px`): `grid-template-columns: repeat(3, minmax(0, 1fr))`; `gap: var(--card-gap)`.
  - **Tablet** (`768px–1023px`): `repeat(2, minmax(0, 1fr))`.
  - **Mobile** (`≤768px`): single column.
- **KPI strip:** `.o-dashboard-kpis` — nested grid inside first full-width row: `repeat(auto-fill, minmax(11rem, 1fr))`; `gap: var(--card-gap)`.
- **Full-width rows:** Activity, AI Insights, Shortcuts, Recent — each in a grid cell spanning all columns (`grid-column: 1 / -1`) where the parent grid applies.

---

## KPI card

- **Component:** `UIComponents.KpiCard(options)`.
- **Structure:** Outer `a.o-kpi-card-link` (navigation) wrapping `UIComponents.Card({ gradient: true, content: … })`.
- **Typography:** Value `.o-kpi-card-value` — large, semibold; label `.o-kpi-card-label` — `color: var(--text-muted)`; font sizes via relative `rem` in CSS only.
- **Material cue:** KPI cards are one of the few surfaces allowed to use stronger raised depth and signature edge treatment.
- **Trend:** Optional. If `trend > 0` → `.o-kpi-trend-up` + arrow/text "up"; if `trend < 0` → `.o-kpi-trend-down`; else `.o-kpi-trend-neutral` (muted).
- **Interaction:** `:focus-visible` on link; hover elevates shadow via `.o-card:hover` on inner card.
- **A11y:** `aria-label` on link including metric name and value.

---

## Activity feed

- **Component:** `UIComponents.ActivityFeed.render(container, activities)`.
- **Container:** `.o-activity-card` (`.o-card`) wrapping `.o-activity-timeline`.
- **Row:** `.o-activity-row` — flex; optional dot `.o-activity-dot`; content column with summary + meta line.
- **Type / state:** `UIComponents.Badge` with variant from mapping (`done` → `success`, `planned` → `info`, default → `muted`).
- **Timestamp:** Relative when possible (e.g. "Today", "In N days"); fallback ISO date string; color `var(--text-muted)`.

---

## AI Insights panel

- **Container:** `.o-ai-insights-card` (`.o-card`).
- **Loading:** `.o-ai-skeleton` blocks using `background: linear-gradient(..., var(--color-surface-2), ...)` — only custom properties / transparent.
- **Body:** Paragraphs for primary insight; anomaly callout `.o-ai-insight-callout` using `var(--color-warning)` / `var(--color-warning-surface)` (token).
- **No hardcoded** rgba in JS — use classes.

---

## Shortcuts bar

- **Component:** `UIComponents.ShortcutsBar.render(container, items)`.
- **Container:** `.o-shortcuts-bar` — flex, `gap: var(--card-gap)`, `flex-wrap: wrap`.
- **Actions:** Each item is `UIComponents.Button({ label, kind: 'primary', onClick })` navigating via `window.location.hash`, or anchor styled as button (prefer Button + onClick for consistency).

---

## Recent items

- **Component:** `UIComponents.RecentItems.render(container, items)`.
- **Container:** `.o-card` + `.o-recent-list` (`ul`).
- **Row:** `.o-recent-row` — flex, `gap: var(--space-md)`; `UIComponents.Avatar` + title link + `.o-recent-meta` timestamp.

---

## Customize drawer

- **Panel:** `.o-dashboard-drawer` — fixed right; width `min(20rem, 100vw)`; `background: var(--color-surface-1)`; `border-left: 1px solid var(--border-color)`; `box-shadow: var(--shadow-lg)`; `z-index` above main.
- **Overlay (optional):** `.o-dashboard-drawer-backdrop` with semi-transparent `var(--color-text)` via `opacity` (no raw hex in new tokens).
- **Content:** heading, checkbox list per widget id (`kpis`, `activity`, `ai-insights`, `shortcuts`, `recent`), Reset + Close via `UIComponents.Button` (`secondary`).
- **Persistence:** unchanged contract — `ir.dashboard.layout` `layout_json` with `{ widgets: string[] }`.

---

## Widget visibility

- Sections tagged `data-widget="<id>"` — toggled with `display: none` when omitted from layout (or class `.o-dashboard-widget-hidden`).

---

## Responsive breakpoints

Align with [webclient.css](../../addons/web/static/src/scss/webclient.css): **1023px**, **768px**, **480px** — tighten padding and stack header actions vertically at **480px** if needed.

---

## Dark mode

All new surfaces use existing `:root` / `[data-theme="dark"]` tokens only.
Dashboard panels should feel like illuminated instruments on top of the darker work plane, not flat cards on a generic dark background.

---

## Accessibility

- Focus-visible rings inherited from global `:focus-visible`.
- Drawer: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on title.
- `prefers-reduced-motion: reduce` — disable gradient animation (already global for `.o-card-gradient`).
