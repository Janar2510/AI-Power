# Design System v2

## Foundation
- Based on UI UX Pro Max skill recommendations
- Uses design tokens in `addons/web/static/src/scss/webclient.css`

## Components
- Button, Card, Badge, Avatar, Modal, Toast
- **Dashboard / home:** `KpiCard`, `ActivityFeed`, `ShortcutsBar`, `RecentItems` (`addons/web/static/src/components/`); orchestration in `addons/web/static/src/core/dashboard.js`.

## Dashboard spec
- Authoritative UI contract: [`design-system/specs/dashboard-home.md`](../design-system/specs/dashboard-home.md) (grid, `--card-gap`, gradient KPI cards, drawer, a11y).

## App shell & navigation
- **Layout:** `#webclient.o-app-shell` = flex row: `#app-sidebar` (categorized menus) + `.o-app-main-column` (`#navbar` + `#main`).
- **Tokens:** sidebar width via `--sidebar-width` / `--sidebar-width-collapsed`; content padding `#main` uses `--space-lg` / `--space-xl` and `--card-gap` in the navbar.

## Implemented in Phases 366-373
- Components are now DOM-based factories (no HTML string stubs).
- Field widgets implement `render(container, fieldName, value, options)`.
- Layout modules render navbar, sidebar, and action layout shells.
- Calendar renderer supports day/week/month modes.
- Gantt renderer supports day/week/month scale switching.

## Implemented in Phases 378-381
- Frontend logic is split into `addons/web/static/src/core/` modules (`router`, `view_manager`, `dashboard`, `settings`, `chatter`, `field_utils`).
- UI/UX Designer and Frontend Builder can now target focused files instead of the monolithic `main.js`.
- This modularization improves maintainability while preserving CSS token usage and component patterns.

## Accessibility
- Focus-visible states
- Contrast target 4.5:1
- Reduced motion support
