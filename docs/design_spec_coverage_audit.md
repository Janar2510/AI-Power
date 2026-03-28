# Foundry One design spec vs implementation audit (Phase 802)

**Specs:** [design-system/specs/](../design-system/specs/) · **CSS:** [webclient.css](../addons/web/static/src/scss/webclient.css), [_tokens.css](../addons/web/static/src/scss/_tokens.css), [_dark.css](../addons/web/static/src/scss/_dark.css)  
**Date:** 2026-03-28

| Spec | Key classes / surfaces | Token / dark | Notes |
|------|------------------------|--------------|-------|
| foundations.md | `:root` in `_tokens.css` / `_dark.css` | Yes | Baseline |
| app-shell.md | `.o-app-shell`, `.o-navbar-*`, `.o-sidebar-*` | Partial review | Glass row in `navbar_chrome.js` + CSS |
| dashboard-home.md | `.o-home-apps`, `.o-app-grid`, `.o-dashboard-kpis`, KPI strip | Yes | `main.js` `renderHome` + `DashboardKpiStrip` |
| list-view.md | `.o-list-shell`, `.o-control-panel`, `.o-pager` | Yes | List module + `list_view.js` |
| form-view.md | `.o-form-header`, `.o-form-sheet`, `.form-ai-sidebar` | Yes | Form module + chatter strip |
| kanban-view.md | `.kanban-column`, `.kanban-card` | Yes | Kanban module |
| graph-view.md | Graph chrome + fallbacks | Mostly | `graph_view.js` / module |
| pivot-view.md | Pivot table chrome | Mostly | `pivot_view.js` / module |
| calendar-view.md | Calendar grid chrome | Mostly | `calendar_view.js` / module |
| gantt-view.md | Gantt placeholder / chrome | Mostly | `gantt_view.js` / module |
| activity-view.md | Activity matrix | Mostly | `activity_view.js` / module |
| settings.md | `.o-settings-shell`, `.o-settings-card` | Yes | `settings.js` + module |

**Gaps:** Pixel-perfect Odoo parity is a non-goal; prioritize token compliance and a11y (see [design_system_a11y_audit.md](design_system_a11y_audit.md)).

**Follow-up:** When adding a new surface, update this table and the spec file in the same PR.
