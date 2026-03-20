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
