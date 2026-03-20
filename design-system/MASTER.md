# ERP Platform Design System

Generated with UI UX Pro Max guidance for enterprise ERP frontend consistency.

## Source
- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

## Direction
- Product Type: B2B ERP / SaaS
- Primary Style: Minimalism + Soft UI Evolution
- Dashboard Style: Executive + Data-Dense

## Tokens
- Use CSS custom properties only
- Use spacing system (`--space-*`) and `--card-gap`
- Keep gradient border animation on primary cards

## Settings

Full layout, fields, tables, and sub-pages: [specs/settings.md](specs/settings.md).

### Surfaces → tokens / classes

| Surface | Classes / components |
|---------|----------------------|
| Index shell | `.o-settings-shell`, `.o-settings-stack`, `gap: var(--card-gap)` |
| Section blocks | `UIComponents.SettingsSection` → `.o-settings-card`, `.o-card-gradient` |
| Nav to sub-pages | `.o-settings-nav-link` + `.o-btn-secondary` |
| Sub-page body | `.o-settings-subpage`, breadcrumbs `.o-settings-breadcrumbs` |
| Fields | `.o-settings-field`, `.o-settings-input`, `.o-settings-toggle`, `.o-settings-password` |
| Tables | `.o-settings-table` via `UIComponents.SettingsTable` |

## List View

Full list/control-panel contract: [specs/list-view.md](specs/list-view.md).

### Surfaces -> tokens / classes

| Surface | Classes / components |
|---------|----------------------|
| List shell | `.o-list-shell`, `.o-list-table-wrapper`, `.o-pager` |
| Control panel | `.o-control-panel`, `.o-search-bar`, `.o-control-panel-actions` |
| View switcher | `UIComponents.ViewSwitcher` -> `.o-view-switcher` |
| Filter chips | `.o-filter-chips`, `.o-filter-chip` |
| Table rows | `.o-list-table`, `.o-list-data-row`, `.o-list-group-header`, `.o-list-group-subtotal` |
| Bulk actions | `UIComponents.BulkActionBar` -> `.o-bulk-action-bar` |

## Dashboard (home)

Full layout and component contracts: [specs/dashboard-home.md](specs/dashboard-home.md).

### Widget zones → tokens / classes

| Zone | `data-widget` | Layout / tokens |
|------|---------------|-------------------|
| KPI strip | `kpis` | `.o-dashboard-kpis`, `gap: var(--card-gap)`; cards `.o-card-gradient` via `UIComponents.KpiCard` |
| Upcoming activities | `activity` | `.o-activity-card`, `.o-activity-timeline`, badges `var(--*)`-based variants |
| AI insights | `ai-insights` | `.o-ai-insights-card`, skeleton + callout tokens (`--color-warning-surface`) |
| Quick actions | `shortcuts` | `.o-shortcuts-bar`, `UIComponents.Button` |
| Recent items | `recent` | `.o-recent-list`, `UIComponents.Avatar` + link row |
| Customize | (drawer) | `.o-dashboard-drawer`, persisted via `ir.dashboard.layout` |
