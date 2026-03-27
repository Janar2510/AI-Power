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

### Alt+ shortcuts (legacy `main.js`)

- Behaviour is implemented in `addons/web/static/src/main.js` (`keydown`, `e.altKey`). A frozen **contract** for documentation and tests lives in `addons/web/static/src/core/webclient_shortcut_contract.js` as **`window.__ERP_WEBCLIENT_SHORTCUT_CONTRACT`** (six **Alt+** bindings: **N** new on list, **S** save form, **E** edit, **L** back to list, **K** kanban on list (**668:** **`dispatchActWindowForListRoute`** with **`shortcutAltK`**), **P** print/preview when controls exist; plus **Escape** for preview/attachment close). **`addons/web/static/tests/test_webclient_shortcut_contract.js`** asserts contract shape.

### Sidebar route debugging

- Set **`window.__ERP_DEBUG_SIDEBAR_MENU = true`** in the browser console, then **reload**. Menus that have no resolvable hash route log a warning (see `main.js` near `_warnSidebarMenuDisabled`). Use this to find stale or misconfigured `ir.ui.menu` / action targets after menu changes. Clear the flag when finished.

## App chrome vs hash (navigation consistency)

- **Main content** is driven by **`location.hash`** (`routeApplyInternal` → list / form / home / reports / …).
- **Sidebar / “current app” in the navbar** used to fall back to **`localStorage`** (`erp_sidebar_app`) and the **first app** even when the hash was **`#home`**, so you could see **Invoicing** (or another app) in the chrome while the **home** dashboard was visible. **`renderNavbar`** now treats **`#home`** (and empty hash) as **neutral**: no stored-app sidebar filter unless the route itself implies an app; **`erp_sidebar_app`** is cleared when landing on home without a route-derived app.
- Submenus that still **do nothing** usually have **`href="#"`** (no resolvable `actionToRoute` / `menuToRoute`); use the debug flag above and fix menu metadata, or accept as scaffolding until those actions exist.

### App id when the hash does not match menu routes (Phase 689)

- **`getAppIdForRoute(route, menus)`** in **`main.js`** first matches menus whose resolved route (**`actionToRoute`** / **`menuToRoute`**) **equals** the current list slug. Nested or differently named menus often **do not** produce the same string as the hash, so the first pass returns **`null`**.
- **Second pass:** resolve the **ORM model** with **`getModelForRoute(route)`**, then scan menus for an **`ir.actions.act_window`** (or legacy **`window`**) whose **`res_model`** equals that model; use that menu’s **`app_id`** (or **`id`**) so the sidebar/header **app** matches Calendar, Helpdesk, Project, POS, HR, Knowledge, and similar deep links.
- **`window.__ERP_getModelForRoute`** is assigned in **`main.js`** (same function as the legacy router). **`menu_utils.js`** **`getAppIdForRoute`** uses **`window.__ERP_getModelForRoute`** when present so the **modular shell** **`menu.getCurrentAppId`** stays aligned with the legacy hash client.
- **Load order:** the legacy **`web.assets_web`** bundle must execute **`main.js`** (which defines **`getModelForRoute`** and the global hook) before any script that calls **`getAppIdForRoute`** from **`menu_utils`** without the hook; in practice **`main.js`** is the large legacy entry and runs in the same page load as **`modern_webclient.js`** after shell bootstrap.

## View open path (Phases 648–652)

- Sidebar leaf clicks and the app picker (**`selectApp`**) that target an **`ir.actions.act_window`** should flow through **`navigateActWindowIfAvailable`** in **`main.js`**, which prefers **`AppCore.ViewManager.openFromActWindow`** (and thus **`env.services.action.doAction`** when the modular runtime is bootstrapped).
- Acceptance: no duplicate **`actionToRoute`** logic beyond **`menu_utils`** / **`ActionManager`**; hash navigation still triggers legacy **`routeApplyInternal`** after **`doAction`** updates the hash.

## List route + form return (Phases 658–659)

- **`dispatchActWindowForListRoute`** in **`main.js`** runs when **`routeApplyInternal`** handles a **list** slug (including deep links): if **`getActionForRoute`** resolves an **`ir.actions.act_window`**, **`ViewManager.openFromActWindow`** runs **before** **`loadRecords`** (no same-hash **`route()`** re-entry — unlike **`navigateActWindowIfAvailable`**).
- After **create** / **write** on a form, returning to the list sets the hash, dispatches the same helper (**`source: 'formSaveReturnList'`**), then **`loadRecords`**.

## Hash navigation audit + Alt+K (Phases 668–669)

- **668:** Some paths still use plain **`href="#…"`** only (**Alt+N**, notifications, form save redirects, etc.) — **`hashchange` → `routeApplyInternal`**. **1.227.0 slice:** **`dispatchListActWindowThenFormHash`** for **list** **Enter → edit**, **list** **Add**, **kanban** **Add** + **card → edit**, **gantt / activity / pivot / calendar** **Add** (**`listKeyboardEnterForm`**, **`listToolbarNew`**, **`kanbanToolbarNew`**, **`kanbanCardOpenForm`**, **`viewChromeToolbarNew`**). **1.228.0 slice:** **list** **Edit** (**`listTableEditLink`**). **1.229.0 slice:** **gantt** name cell, **activity** matrix record/cell links, **calendar** events — **`a.o-erp-actwindow-form-link`** + **`attachActWindowFormLinkDelegation`** (**`ganttNameEditLink`**, **`activityMatrixEditLink`**, **`calendarEventEditLink`**). **Alt+K** → **`shortcutAltK`**. **726:** Form **object** **`act_window`** + **`res_id`** → **`route()`**.
- **Dev (post-695):** **`ViewManager.openFromActWindow`** sets **`window.__ERP_lastLoadViews`** with **`fieldsKeyCount`** and **`fieldsSampleKeys`**; set **`window.__ERP_DEBUG_LOAD_VIEWS = true`** before navigation to **`console.debug`** the payload.
- **669:** **`routeApplyInternal`** must not call **`dispatchActWindowForListRoute`** immediately before **`renderForm`** for **bare** form URLs that **`doAction`** would rewrite away. The **668** slice above applies only where navigation **originates from list/kanban (and related) chrome** and the next hash is still a **form** URL. Parent list sync remains **list slug** entry and **form save → list** (**659**).
- **696:** **`renderForm`** compares **`formLeaf`** (`**route/new**` or **`route/edit/id`**) to the decoded **`actionStack`** tail (**670**): if the stack already ends on that leaf, breadcrumbs are not duplicated; if the stack ends on the **list** slug for this **`route`**, only the **form** crumb is appended.

## Action stack query vs Odoo (Phase 670 — light)

- **`ActionManager.decodeStackFromHash(hash)`** in **`action_manager.js`** reads a **`stack=`** query parameter (base64 JSON array) and returns the decoded stack or **`null`**. **`routeApplyInternal`** in **`main.js`** assigns the result to **`actionStack`** when non-empty so in-hash stack state is restored on navigation.
- **Phase 694:** When **`applyActionStackForList`** builds a multi-crumb stack from menu chrome (**681**), **`syncHashWithActionStackIfMulti`** writes **`?stack=`** via **`ActionManager.syncHashWithStack`** (uses **`location.replace`** to avoid extra history entries). **`applyActionStackForList`** also **preserves** a decoded multi-crumb stack when the URL already carries **`stack=`** and the list **base slug** matches the current leaf, so **`hashchange`** re-entry does not collapse crumbs to a single row.
- Full Odoo **breadcrumb / action stack** parity (every **`doAction`** push matching upstream) is **not** claimed here; **670** + **694** cover **read** + **write** for the legacy hash client when stacks are enabled.

## View switch + ViewManager list sync (Phases 680–682)

- **680:** **`setViewAndReload`** (list ↔ kanban / graph / … via **`?view=`** on the same slug) calls **`dispatchActWindowForListRoute(route, { source: 'listViewSwitch' })`** before updating the hash so the action service stays aligned when switching modes.
- **681:** When navigation comes from the **sidebar**, **app picker** (**`selectApp`**), or **`navigateFromMenu`** (**`fromMenu`**), **`renderList`** **appends** a breadcrumb if the stack is non-empty and the new route differs from the current leaf (base slug, ignoring **`?`**). Otherwise it resets to a **single** crumb (deep links, **`dispatchActWindowForListRoute`**, view switcher). Multi-crumb hashes still use **`?stack=`** (**670**).
- **682:** **`AppCore.ViewManager.syncListRouteFromMain(route, getActionForRoute, options)`** centralises list-route **`act_window`** dispatch; **`dispatchActWindowForListRoute`** in **`main.js`** delegates to it (fallback to inline **`openFromActWindow`** if the helper is missing).

## Website / eCommerce shell tiles (Phase 660 — product scope)

- **`#website`** and **`#ecommerce`** (or equivalent slugs from **`menuToRoute`**) remain **empty-state placeholders** in the legacy hash client: they signal that **`website` / `website_sale` backend modules** are not surfaced as a full public site builder or shop UX in this client.
- **Phase 687:** Placeholders include a **secondary** action — **Open Products** (**`#products`**) on **Website**, **Open Sale Orders** (**`#orders`**) on **eCommerce** — via **`UIComponents.EmptyState`** **`secondaryActionLabel`** / **`secondaryActionFn`**.
- **Non-goal (this release):** building storefront/editor flows in **`main.js`**. Use backend menus (Products, Sale Orders, Invoicing, etc.) for catalogue and orders until a dedicated phase scopes **Website** front-office parity. See **`docs/deferred_product_backlog.md`** for related deferrals.

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

**Pilot hook (Phase 576 / v1.209.0; executed as Phase 586 in v1.210.0):** Set **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`** in the server environment: **`_webclient_html`** serves **per-manifest JS `<script>` URLs** (same order as `get_bundle_urls("web.assets_web")`) instead of the single concat **`/web/assets/web.assets_web.js`** tag; CSS remains **`/web/assets/web.assets_web.css`**. `window.__erpFrontendBootstrap` includes **`"esbuildPrimary": true`**. Run full shell regression (DeploymentChecklist **1.210.0**) before production; default remains concat + additive **`modern_webclient.js`** when the env var is unset. Covered by **`tests/test_http.py`** `test_webclient_html_esbuild_primary_env_lists_per_file_js_phase584`.

## PWA manifest stub (Phase 548) + service worker stub (Phase 553)

- **Public** `GET /web/manifest.webmanifest` returns minimal Web App Manifest JSON (`name`, `start_url`, `display`, theme colours).
- The webclient shell HTML includes `<link rel="manifest" href="/web/manifest.webmanifest"/>`.
- **Phase 553:** **Public** `GET /web/sw.js` serves a minimal service worker (`install` → `skipWaiting`, `activate` → `clients.claim`). The shell registers it with `navigator.serviceWorker.register("/web/sw.js")` when supported.
- **Phase 556 / 593:** The worker **pre-caches** shell URLs with **cache-first** `fetch` (**`CACHE`:** `erp-web-shell-v2` in `web_service_worker_stub`): default **concat** CSS + `web.assets_web.js`; when **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`**, precache is **CSS + each manifest JS file** from `get_bundle_urls("web.assets_web")`. Bump **`CACHE`** in [core/http/routes.py](core/http/routes.py) when the precache set changes materially, or unregister the SW during development to avoid stale CSS/JS.
- **Limitation:** **No offline RPC** or full app cache — shell static files only; CRUD and JSON-RPC require network.

## Modular action service (Phases 636–639)

Aligned with Odoo 19 **`webclient/actions`** boundaries (clean-room): the bundled runtime owns **`env.services.action`** as the single entry for navigation from actions and sidebar items.

| API | Role |
|-----|------|
| **`doAction(actionDef, options)`** | Delegates to legacy **`Services.action`** for classification; for **`ir.actions.act_window`** (or legacy `{ type: 'window', action }`) applies **`actionToRoute`** and **`router.navigate`** so the hash matches the shell. |
| **`navigateFromMenu(menu)`** | Resolves **`views.getAction(menu.action)`** and calls **`doAction`**, else **`menuToRoute(menu)`** + navigate. Sidebar leaf links use **`data-menu-id`** and call this on primary click (Phase **637**). |
| **`doActionButton(opts)`** | Pass-through to **`window.ActionManager.doActionButton`** (object / action / report buttons). |

**Runtime handle:** **`window.ERPFrontendRuntime.action`** (same object as **`env.services.action`**) for debugging and future legacy bridges.

New product work should prefer these APIs over adding routes directly in **`main.js`**.

## Troubleshooting: app tile opens Home (Phases 630–633)

Symptom: choosing an app from the launcher or sidebar changes the URL hash but the UI shows **Home** again. In legacy **`main.js`**, **`routeApplyInternal`** calls **`getModelForRoute(route)`**; when it returns **nothing**, the router falls back to **`renderHome()`** with no message.

**Diagnose**

1. Note **`location.hash`** (e.g. `#expenses`, `#website`).
2. In the console, set **`window.__ERP_DEBUG_SIDEBAR_MENU = true`** and reload; menus that cannot resolve a route log **`[sidebar] menu without route`** (see **`main.js`** near **`_warnSidebarMenuDisabled`**).
3. Optional: set **`window.__ERP_STRICT_ROUTING = true`** — unknown list routes render an **empty state** instead of silently returning home (Phase **633**).

**Fix direction**

- Align **`menuToRoute`**, **`actionToRoute`**, **`DATA_ROUTES_SLUGS`**, and **`getModelForRoute`** in **`addons/web/static/src/main.js`** with real menu **`name`** strings and **`ir.actions.act_window`** metadata.
- Run **`python3 -m unittest tests.test_main_js_route_consistency_phase631`** after editing routes.

## Non-Goals

- Exact Odoo Owl/legacy JS implementation
- Full mobile JS layer (deferred)
