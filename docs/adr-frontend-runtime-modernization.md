# ADR: Frontend Runtime Modernization

## Status

Accepted for phases 1-5 frontend migration.

## Decision

The ERP web client is moving from a concat-first, global-script runtime toward an Odoo-19-aligned modular frontend architecture.

The new strategic target is:

- bundled modern frontend entry
- explicit bootstrap object in the HTML shell
- env creation and service startup
- registry-based extensibility
- component-owned shell and view surfaces
- legacy runtime preserved only as a migration adapter

## Why

The current frontend is functional but structurally concentrated in `addons/web/static/src/main.js`. That makes shell design, view migration, testing, and modular ownership harder than they need to be.

The local `odoo-19.0/addons/web` reference shows a stronger separation between:

- bootstrap
- env/services
- webclient shell
- navbar/menu ownership
- action container and views

This ADR adopts that architectural direction while preserving clean-room implementation and the Foundry One design system.

## Immediate Consequences

- `window.__erpFrontendBootstrap` becomes the browser bootstrap contract.
- `/web/webclient/load_menus` is introduced as an Odoo-style menu bootstrap endpoint.
- `addons/web/static/dist/modern_webclient.js` becomes the primary frontend runtime entry.
- `addons/web/static/src/main.js` remains present, but only as a migration adapter while the new runtime takes ownership incrementally.

## Non-Decision

This ADR does not require exact OWL source parity or direct reuse of Odoo webclient code.

The target is Odoo-like architecture and ownership boundaries, not verbatim implementation.
