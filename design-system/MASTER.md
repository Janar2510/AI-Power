# Foundry One Design System

Generated for the ERP platform with UI UX Pro Max guidance and aligned to the existing metadata-driven web client.

## Source
- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Brand foundation: [../docs/brand-system.md](../docs/brand-system.md)
- Frontend rules: [../docs/frontend-design-rules.md](../docs/frontend-design-rules.md)

## Direction
- Product Type: AI-powered modular ERP
- Working Product Brand: **Foundry One**
- Brand Character: Industrial executive
- Primary Style: Subtle professional skeuomorphism
- Visual Metaphor: Precision-crafted operations cockpit
- Dashboard Style: Executive, tactile, data-dense

## Foundational Principles
- Preserve Odoo-like action-first flows and metadata-driven rendering.
- Prefer tactile depth over decorative nostalgia.
- Make dense business data feel calm, structured, and legible.
- Support long-session use with balanced contrast, restrained motion, and clear hierarchy.
- Maintain first-class light and dark mode parity from the token layer upward.

## Token System
- Use CSS custom properties only for new visual work.
- Token layers: brand, semantic, surface, component, motion, accessibility.
- Use spacing system (`--space-*`) and `--card-gap`.
- Use surface recipes instead of ad-hoc per-component styling.
- Keep gradient border animation on primary KPI and hero cards only.
- New implementation work must replace inline visual `style=` usage with classes and tokenized CSS.

## Material Language
- Primary shell materials: satin metal, smoked glass, engineered paper, precision shadow.
- Interaction cues: inset fields, raised actions, crisp focus rings, restrained gleam edges.
- Avoid novelty leather stitching, exaggerated bevels, or retro desktop parody.

## Core Specs
- Foundations: [specs/foundations.md](specs/foundations.md)
- App shell: [specs/app-shell.md](specs/app-shell.md)
- Dashboard: [specs/dashboard-home.md](specs/dashboard-home.md)
- List view: [specs/list-view.md](specs/list-view.md)
- Form view: [specs/form-view.md](specs/form-view.md)
- Kanban view: [specs/kanban-view.md](specs/kanban-view.md)
- Settings: [specs/settings.md](specs/settings.md)

## Shell Surfaces

| Surface | Classes / components |
|---------|----------------------|
| App shell | `#webclient.o-app-shell`, `.o-app-main-column`, `.o-app-shell-surface` |
| Sidebar | `.o-app-sidebar`, `.o-sidebar-category`, `.o-sidebar-link`, `.o-sidebar-subgroup` |
| Navbar | `#navbar`, `.o-navbar-shell`, `.o-navbar-glass`, `.o-navbar-brand` |
| Breadcrumbs | `.o-breadcrumbs`, `.o-breadcrumbs-link`, `.o-breadcrumbs-current` |
| Search / command | `.o-global-search`, `.o-command-palette-panel`, `.o-search-field-inset` |
| Systray / status | `.o-systray-registry`, `.o-status-chip`, `.o-notification-drawer` |

## Business Surfaces

| Surface | Classes / components |
|---------|----------------------|
| Settings shell | `.o-settings-shell`, `.o-settings-stack`, `.o-settings-card`, `.o-settings-subpage` |
| List shell | `.o-list-shell`, `.o-control-panel`, `.o-list-table-wrapper`, `.o-pager` |
| Form shell | `.o-form-header`, `.o-form-sheet`, `.o-button-box`, `.form-ai-sidebar` |
| Kanban shell | `.kanban-column`, `.kanban-card`, `.kanban-bulk-bar` |
| Dashboard widgets | `.o-dashboard-kpis`, `.o-activity-card`, `.o-ai-insights-card`, `.o-dashboard-drawer` |

## Accessibility and Behavior
- Contrast target: 4.5:1 minimum for standard text.
- Preserve `:focus-visible` at every interactive layer.
- Respect `prefers-reduced-motion`.
- Support keyboard access for search, navigation, breadcrumbs, systray, filters, and drawer/modal flows.
