# Frontend Framework Rules

## Overview

The web client is a metadata-driven framework that renders UI from declarative view definitions. It targets Odoo-like parity for action-first navigation, view architecture, and control panel behaviour.

The active product direction is defined by the Foundry One brand system and the design system specs. Frontend work must preserve parity-oriented architecture while following the shell-first, light/dark-safe, class-and-token-based UI model documented in:

- `docs/brand-system.md`
- `docs/frontend-design-rules.md`
- `design-system/MASTER.md`
- `design-system/specs/foundations.md`
- `design-system/specs/app-shell.md`

## UI/UX Rules

### Action-First Navigation

- Router and breadcrumbs treat actions as first-class (window, client, URL)
- Workflow is action-driven; scheduled actions modelled as `ir.cron`

### View Architecture

- Support progressive enhancement: list ↔ form ↔ kanban
- Rendering pipeline: XML → AST → render
- UI declarations are module data

### Control Panel

- Centralise search, filters, grouping, favourites, context actions
- Consistent surface across list/form/kanban views

### Shell-First Design

- Sidebar, navbar, breadcrumbs, search, notifications, systray, and AI entry points are part of one app-shell contract
- View specs inherit from the foundations and app-shell specs rather than styling each surface in isolation
- Light and dark mode parity is required from the token layer upward

## Component Model

- **Registries**: View types, field widgets, services, public components
- **Service container**: rpc, notification, action, router, session, i18n, user, company
- **Modifier evaluation**: Small Python-expression evaluator in JS for view modifiers

## State Rules

- **Server-state**: Authoritative; versioned by write-date; updated by RPC
- **UI-state**: Ephemeral (dialogs, edit modes, filters); serialisable for session restore

## i18n, Accessibility, Theming

- **Translation**: `_(...)` wrappers; `.po` compatible; module-scoped
- **Accessibility**: Keyboard nav, ARIA roles, contrast, focus visibility
- **Theming**: SCSS variables; bundle inheritance (before/after/replace/remove)
- **Responsive**: Breakpoints; table collapse, form stack, kanban scale

## Styling Guardrails

- New visual styling should be class-based and token-driven
- Do not add new inline visual `style=` assignments when a shared class or surface recipe can own the styling
- New UI work must support both light and dark mode before it is considered complete
- Shared elements should use the minimum element inventory from `design-system/specs/foundations.md`

## Testing

- **JS unit tests**: Mock server, deterministic RPC fixtures
- **Integration tours**: Playwright e2e for business flows
- **Asset debug**: `debug=assets` for no minification, sourcemaps

## Parity Targets

- Asset bundling semantics
- Service injection pattern
- View renderer contracts

## Asset delivery (Phase 527)

- **Default (Odoo-like):** `core/modules/assets.py` **concatenates** manifest-listed files into `web.assets_web.js`. Files in that bundle must be **classic scripts** — no top-level `export` / ESM (browsers load one concatenated file).
- **Guard:** `npm run check:assets-concat` scans `addons/web/__manifest__.py` `web.assets_web` entries and fails on `export` at line start. Run in CI and locally before merging UI changes.
- **Optional esbuild path:** `npm run build:web` emits `addons/web/static/dist/web.bundle.js` (IIFE) from `main.js` for experiments or Docker multi-stage pre-COPY builds; it does **not** replace concat unless you wire templates to serve the bundle (document any switch in `DeploymentChecklist.md`).

## Production deployment default (Phase 534)

- **Shipped behaviour:** The live web client continues to load **concatenated** `web.assets_web.js` from manifests. This is the supported production default until a project explicitly switches templates to a single bundled entry and regression-tests the shell.
- **esbuild** remains optional (CI builds it to catch breakage; Docker comment describes multi-stage). Choosing esbuild-primary for production requires an ADR-style note in `DeploymentChecklist.md` and template wiring — not implied by `npm run build:web` alone.

## Dual-codebase asset strategy (Phase 542)

When planning web changes, compare **read-only** `odoo-19.0/addons/web/__manifest__.py` `assets` (Odoo 19 uses a **bundled** pipeline with many named bundles and `t-call-assets` in templates) with ERP’s **[addons/web/__manifest__.py](addons/web/__manifest__.py)** and **[core/modules/assets.py](core/modules/assets.py)**.

| Aspect | Odoo 19 CE (reference) | ERP (default) |
|--------|-------------------------|---------------|
| Primary delivery | Webpack-like asset graph per bundle | **Concatenation** of listed paths into one `web.assets_web.js` |
| ESM | Supported inside upstream bundler | **Forbidden** top-level `export` in concat entries; use `npm run check:assets-concat` |
| Optional bundle | N/A for ERP | `npm run build:web` → IIFE `dist/web.bundle.js`; production switch requires template wiring + checklist ADR |

**Decision:** Keep **concat + guard** as the supported production default until product approves esbuild-primary and CI/regression covers the shell. Document any switch in `DeploymentChecklist.md`.

## Non-Goals

- Exact Odoo Owl/legacy JS implementation
- Full mobile JS layer (deferred)
