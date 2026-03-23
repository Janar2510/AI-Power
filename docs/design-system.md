# Design System v3

## Summary

The ERP frontend now has a formal brand and shell direction rather than a collection of isolated view specs. The design system is built for **Foundry One**, a subtle professional skeuomorphic ERP experience that keeps Odoo-like workflows and metadata-driven rendering while introducing a clearer brand, stronger shell hierarchy, and stricter frontend governance.

## Source of Truth

- Brand system: [`docs/brand-system.md`](./brand-system.md)
- Frontend rules: [`docs/frontend-design-rules.md`](./frontend-design-rules.md)
- Master direction: [`design-system/MASTER.md`](../design-system/MASTER.md)
- Token implementation target: `addons/web/static/src/scss/webclient.css`

## Product Direction

- Working product brand: **Foundry One**
- Product type: AI-powered modular ERP
- Experience target: executive, tactile, data-dense, long-session friendly
- Style: subtle professional skeuomorphism
- Metaphor: precision-crafted operations cockpit

## Frontend Architecture Constraints

- Preserve the current metadata-driven frontend and AppCore/UIComponents model.
- Keep action-first navigation and view rendering contracts unchanged.
- Use docs and rules to guide refactoring away from HTML-string inline styling, not a framework rewrite.
- Treat shell, theming, motion, and shared surface recipes as architecture.

## Token Layers

- **Brand tokens:** product character, accent identity, shell signature
- **Semantic tokens:** text, background, border, success, warning, danger, info
- **Surface tokens:** shell, glass, panel, card, inset field, overlay, drawer
- **Component tokens:** buttons, chips, badges, inputs, table states, cards
- **Motion tokens:** durations, easing, view transitions, pressed-state timing
- **Accessibility tokens:** focus, contrast reinforcement, reduced-motion fallbacks

## Surface Hierarchy

- **Shell:** sidebar, navbar, breadcrumbs, command/search, systray, notifications, AI entry points
- **Work plane:** dashboard, list, form, kanban, settings, dialogs, drawers
- **Utility surfaces:** empty states, onboarding, report preview, attachment viewer, toasts

## Specs

- Foundations: [`design-system/specs/foundations.md`](../design-system/specs/foundations.md)
- App shell: [`design-system/specs/app-shell.md`](../design-system/specs/app-shell.md)
- Dashboard: [`design-system/specs/dashboard-home.md`](../design-system/specs/dashboard-home.md)
- List view: [`design-system/specs/list-view.md`](../design-system/specs/list-view.md)
- Form view: [`design-system/specs/form-view.md`](../design-system/specs/form-view.md)
- Kanban view: [`design-system/specs/kanban-view.md`](../design-system/specs/kanban-view.md)
- Settings: [`design-system/specs/settings.md`](../design-system/specs/settings.md)

## Shared Components

- Button, Card, Badge, Avatar, Modal, Toast
- EmptyState, OnboardingPanel, PdfViewer, AttachmentViewer
- Dashboard surfaces: `KpiCard`, `ActivityFeed`, `ShortcutsBar`, `RecentItems`
- Settings surfaces: `SettingsField`, `SettingsTable`, `SettingsSection`
- List surfaces: `ControlPanel`, `ViewSwitcher`, `Pager`, `BulkActionBar`

## Design Coverage

The global design system now explicitly covers:

- branding and naming
- typography hierarchy
- light and dark color systems
- shell materials and surface depth
- motion and reduced-motion behavior
- minimum element inventory for ERP work surfaces

## Theming

- Light and dark mode are both required at the spec stage.
- New visual work must use CSS custom properties and semantic class recipes.
- Dark mode should feel like smoked metal and illuminated instrumentation.
- Light mode should feel like engineered paper, satin composite, and daylight glass.

## Current Implementation Notes

- The frontend already includes dark-mode token support and shell structure in `webclient.css`.
- Frontend logic has been split into `addons/web/static/src/core/` modules, but visual authority is still partially trapped in `main.js`.
- Future UI work should prioritize shell surfaces and shared controls where inline visual styling is currently most concentrated.

## Quality Bar

- Focus-visible states are mandatory.
- Contrast target remains 4.5:1 minimum for standard text.
- Reduced motion support is required.
- New docs and implementation work should reduce design debt, not add parallel styling systems.
