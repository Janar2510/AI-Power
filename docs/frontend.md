# Frontend Framework Rules

## Overview

The web client is a metadata-driven framework that renders UI from declarative view definitions. It targets Odoo-like parity for action-first navigation, view architecture, and control panel behaviour.

The active migration direction is now a **modular bundled runtime** with an explicit bootstrap object, env creation, services, registries, and shell ownership closer to `odoo-19.0/addons/web`.

The active product direction is defined by the Foundry One brand system and the design system specs. Frontend work must preserve parity-oriented architecture while following the shell-first, light/dark-safe, class-and-token-based UI model documented in:

- `docs/brand-system.md`
- `docs/frontend-design-rules.md`
- `design-system/MASTER.md`
- `design-system/specs/foundations.md`
- `design-system/specs/app-shell.md`
- `docs/adr-frontend-runtime-modernization.md`
- `docs/odoo19-webclient-gap-table.md`
- `docs/frontend-migration-map.md`
- `docs/frontend-shell-contract.md`
- `docs/frontend-service-registry.md`
- `docs/frontend-view-contracts.md`

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
- **Migration rule**: the modular runtime is now the strategic owner; legacy globals are temporary adapters

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

## Keyboard (Phase 558)

- **Mod+K** (Cmd+K on macOS): open the **command palette** (`command_palette.js` + `Services.hotkey`). **Escape** closes the palette and restores focus to the previously focused element. See [README.md](../README.md) quick tips.

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
- **Modern build path:** `npm run build:web` targets `addons/web/static/src/app/main.js` and emits `addons/web/static/dist/modern_webclient.js` for the modular runtime. `npm run build:web:legacy` remains available for the legacy adapter entry.

## Modern runtime foundation (Phase 1)

- Primary browser bootstrap now begins with `window.__erpFrontendBootstrap`.
- The modular runtime entry is `addons/web/static/dist/modern_webclient.js`.
- `addons/web/static/src/main.js` remains available as a legacy adapter and migration seam.
- `/web/webclient/load_menus` is available as an Odoo-style menu bootstrap endpoint for the new runtime.

## OWL shell cutover (Phase 2)

- The modular frontend now uses a locally vendored OWL runtime from `addons/web/static/lib/owl/owl.js`, sourced from the local `odoo-19.0` checkout to stay architecture-aligned without introducing a network dependency.
- `addons/web/static/src/app/webclient.js` now owns shell startup and mounts OWL shell units into the stable legacy DOM hosts instead of letting `main.js` render the navbar.
- `addons/web/static/src/app/navbar.js` and `addons/web/static/src/app/sidebar.js` are the current modular shell units.
- `addons/web/static/src/app/services.js` now owns the service/registry layer for `session`, `menu`, `router`, `action`, `theme`, `notification`, and shell coordination.
- `addons/web/static/src/main.js` continues to own content/view rendering for unmigrated surfaces, but it now defers shell ownership when the runtime is `modern`.

## Modular bootstrap — acceptance criteria (Phase P)

Use this checklist before marking **Modular frontend bootstrap foundation** as complete in `docs/parity_matrix.md`. Full view/shell extraction remains tracked in `docs/odoo19-webclient-gap-table.md`.

| Criterion | Evidence |
|-----------|----------|
| Bootstrap object | `_webclient_html` / `webclient_templates.xml` sets `window.__erpFrontendBootstrap` (session, version, endpoints). |
| Bundled entry | `npm run build:web` → `addons/web/static/dist/modern_webclient.js` (IIFE); shell loads it after inline bootstrap. |
| Env + services | `addons/web/static/src/app/main.js`: `createBootstrap` → `createEnv` → `startServices` → `WebClient.mount`. |
| Registries | `createRegistry()` on `env.registries` for extensibility (categories keyed by name). |
| Menu endpoint | `GET /web/webclient/load_menus` returns JSON menu list; `tests/test_http.py` covers auth + static bundle. |
| Menu service | `env.services.menu.load()` calls `endpoints.menus` first, then falls back to `load_views` payload (`services.js`). |
| Non-blocking warm cache | Modern boot triggers `menu.load(false)` so the dedicated endpoint is exercised early without blocking `mount`. |
| Legacy seam | `legacyAdapterEnabled` (default true) starts `window.__erpLegacyRuntime` for views not yet owned by the modular shell. |

**Not required for “foundation” done:** Owning every view in the modular bundle (list/form/kanban still primarily legacy), or retiring concat `web.assets_web.js` (see Production deployment default above).

## Wave Q — shell + list control panel (Phases 561–562)

- **`attachShellChrome(env)`** ([`addons/web/static/src/app/shell_chrome.js`](../addons/web/static/src/app/shell_chrome.js)): sets `data-erp-shell-owner`, `data-erp-shell-navbar`, `window.__erpModernShell` when `WebClient.mount` runs.
- **`AppCore.ListControlPanel`** (same bundle via [`list_control_panel.js`](../addons/web/static/src/app/list_control_panel.js)): list search dropdowns, quick filters, and action buttons; [`core/list_view.js`](../addons/web/static/src/core/list_view.js) delegates when present. See `docs/odoo19-webclient-gap-table.md`.

## Production deployment default (Phase 534)

- **Shipped behaviour:** The live web client continues to load **concatenated** `web.assets_web.js` from manifests. This is the supported production default until a project explicitly switches templates to a single bundled entry and regression-tests the shell.
- The modular runtime bundle is now part of the primary migration path. Until phases 1-5 finish, keep concat assets plus the legacy adapter available for rollback.

## Dual-codebase asset strategy (Phase 542)

When planning web changes, compare **read-only** `odoo-19.0/addons/web/__manifest__.py` `assets` (Odoo 19 uses a **bundled** pipeline with many named bundles and `t-call-assets` in templates) with ERP’s **[addons/web/__manifest__.py](addons/web/__manifest__.py)** and **[core/modules/assets.py](core/modules/assets.py)**.

| Aspect | Odoo 19 CE (reference) | ERP (default) |
|--------|-------------------------|---------------|
| Primary delivery | Webpack-like asset graph per bundle | **Concatenation** of listed paths into one `web.assets_web.js` |
| ESM | Supported inside upstream bundler | **Forbidden** top-level `export` in concat entries; use `npm run check:assets-concat` |
| Modular runtime bundle | N/A for ERP | `npm run build:web` → IIFE `dist/modern_webclient.js`; legacy adapter remains behind `main.js` |

**Decision:** Keep **concat + guard** as the supported production default until product approves esbuild-primary and CI/regression covers the shell. Document any switch in `DeploymentChecklist.md`.

**Milestone (Phase 573 / Wave U, v1.208.0):** Production default remains **concat + guard**; **esbuild-primary** templates are **not** piloted in CI. After each `npm run build:web`, smoke: login, list filters/control panel, form save/cancel, shell markers (`data-erp-shell-owner`, `data-erp-navbar-contract` when modern bundle loads).

## PWA manifest stub (Phase 548) + service worker stub (Phase 553)

- **Public** `GET /web/manifest.webmanifest` returns minimal Web App Manifest JSON (`name`, `start_url`, `display`, theme colours).
- The webclient shell HTML includes `<link rel="manifest" href="/web/manifest.webmanifest"/>`.
- **Phase 553:** **Public** `GET /web/sw.js` serves a minimal service worker (`install` → `skipWaiting`, `activate` → `clients.claim`). The shell registers it with `navigator.serviceWorker.register("/web/sw.js")` when supported.
- **Phase 556:** The same worker **pre-caches** concat shell assets (`/web/assets/web.assets_web.css`, `/web/assets/web.assets_web.js`) and uses **cache-first** `fetch` for those URLs only. Bump the `CACHE` constant in [core/http/routes.py](core/http/routes.py) when the bundle content changes materially, or unregister the SW during development to avoid stale CSS/JS.
- **Limitation:** **No offline RPC** or full app cache — shell static files only; CRUD and JSON-RPC require network.

## Non-Goals

- Exact Odoo Owl/legacy JS implementation
- Full mobile JS layer (deferred)
