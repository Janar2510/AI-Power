# Frontend Shell Contract

## Purpose

Defines the runtime ownership of the Foundry One app shell for the modular frontend migration.

## Shell Units

- `WebClient`: app root and runtime coordinator
- `MainShell`: shell coordinator that owns runtime mode, shell state, and legacy-safe slot mounting
- `NavBar`: OWL-mounted shell unit for brand, menus, dropdowns, and utilities
- `Sidebar`: OWL-mounted shell unit for app navigation and mobile/desktop collapse behavior
- `Breadcrumbs`: route hierarchy and navigation context
- `Systray`: structural utility zone

## Runtime Notes

- OWL runtime is vendored locally from `odoo-19.0/addons/web/static/lib/owl/owl.js` and served from `addons/web/static/lib/owl/owl.js`
- modern shell units mount into the stable legacy DOM hosts `#navbar` and `#app-sidebar` so the content renderer can migrate incrementally without breaking `main.js`
- legacy `main.js` no longer owns navbar rendering when `window.__erpFrontendBootstrap.runtime === "modern"`

## Required Behaviors

- light and dark mode parity
- keyboard-accessible dropdowns
- mobile sidebar behavior
- theme persistence
- company and language switching
- route-safe shell updates
- reduced-motion-safe transitions

## Design Rules

- Foundry One subtle professional skeuomorphism remains the design direction
- shell surfaces use shared tokens and classes
- no new shell visuals should be owned by inline `style=`
- shell structure must remain stable across modules
