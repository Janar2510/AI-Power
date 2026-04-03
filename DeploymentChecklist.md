# Deployment Checklist

## Post-1.250.17 — View Ownership Transfer

### Pre-Deployment
- [ ] `core/release.py` version is `1.250.17`
- [ ] `npm run build:web` completes without error (bundle ~362 KB)
- [ ] `npm run check:bundle-budget` exits 0

### Post-Deployment Verification

**View module helpers**
- [ ] `window.AppCore.ListViewModule.helpers.getListColumns("res.partner")` returns an array
- [ ] `window.AppCore.ListViewModule.helpers.buildSearchDomain("res.partner", "test")` returns domain array
- [ ] `window.AppCore.FormViewModule.helpers.getFormFields("res.partner")` returns array
- [ ] `window.AppCore.KanbanViewModule.helpers.getKanbanGroupBy("crm.lead")` returns `"stage_id"`

**Routing / titles**
- [ ] Navigate to `#contacts` — title shows "Contacts" (from `SR.getTitle` delegation)
- [ ] Navigate to `#manufacturing` — title shows "Manufacturing Orders"
- [ ] Unknown hash `#zzz_test` — title falls back to "Zzz_test" (capitalized)

**main.js slim-down**
- [ ] `main.js` is 1,288 lines (down from 1,415 at 1.250.16)
- [ ] No console errors related to getTitle, getListColumns, or saved filters

---

## Post-1.250.16 — Production Hardening

### Pre-Deployment
- [ ] `core/release.py` version is `1.250.16`
- [ ] `npm run build:web` completes without error
- [ ] `npm run check:bundle-budget` exits 0 (bundle ≤ 400 KB)
- [ ] `python -m pytest tests/test_rpc.py -v` passes

### Post-Deployment Verification

**RPC Security**
- [ ] POST `/jsonrpc` with `{"method": "nonexistent.method"}` → HTTP 404, body `{"error": {"code": -32601}}`
- [ ] Verify no `params` are echoed in the response body
- [ ] Server log shows WARNING for the unknown method attempt

**PWA**
- [ ] Open DevTools → Application → Service Workers — shows `/web/sw.js` registered with scope `/`
- [ ] No 404 for the service worker URL in the Network tab

**Debug menu**
- [ ] Debug button shows in navbar when `localStorage.erp_debug_mode === "1"`
- [ ] Click button → dropdown opens with version, "View metadata", "Technical info", "Toggle assets debug", "Run JS tests"
- [ ] All dropdown item backgrounds use CSS variables (no hardcoded colours)

**AI routes**
- [ ] Unauthenticated `POST /ai/chat` → HTTP 401
- [ ] 31st request from same session within 60s → HTTP 429 with `retry_after`
- [ ] Authenticated request still works normally

**Bundle budget**
- [ ] `npm run build:web:meta` generates `dist/meta.json`
- [ ] `npm run check:bundle-budget` reports ✅ OK and exits 0

---

## Post-1.250.15 — ViewService Completion + Legacy Extraction

### Pre-Deployment
- [ ] `core/release.py` version is `1.250.15`
- [ ] `npm run build:web` completes without error (bundle ~351 KB)
- [ ] `test_runner.html` — new suites `test_view_service.js`, `test_pwa.js`, `test_action_service_full.js` all pass

### Post-Deployment Verification

**ViewService**
- [ ] `window.AppCore.ViewService.loadViews("res.partner", ["list","form"])` returns `{ views: { list: { arch, fields }, form: { arch, fields } }, fields: {...} }` in DevTools console
- [ ] Call a second time — same Promise returned (no extra network request)
- [ ] `window.AppCore.ViewService.getCachedView("res.partner", "list")` returns non-null arch after first `loadViews` call
- [ ] `window.AppCore.ViewService.clearViewCache("res.partner")` then `loadViews` — fresh fetch occurs

**Routing extraction**
- [ ] `window.__ERP_RouteEngine` present in DevTools
- [ ] `window.__ERP_canMountOwl()` returns `false` before ActionContainer mounts, `true` after
- [ ] Hash navigation still works: `#contacts` → contact list, `#contacts/edit/1` → form
- [ ] `window.__ERP_BreadcrumbEngine.getStack()` reflects current navigation stack

**OWL/CSP consolidation**
- [ ] Both `route_engine.js` `canMountOwl()` and `owl_bridge.js` `canMountOwl()` agree (same value in DevTools)
- [ ] Legacy renderers are used when `cspScriptEvalBlocked = true` (no OWL double-render)

---

## Post-1.250.14 — Search, Action, and Command Parity

### Pre-Deployment

- [ ] `core/release.py` version is `1.250.14`
- [ ] `npm run build:web` completes without error (bundle ~348 KB)
- [ ] Open `test_runner.html` — existing routing smoke + relational model suites still pass

### Post-Deployment Verification

**Search integration**
- [ ] Mount a standalone `ListController` (no `WithSearch`) — inline `SearchBar` appears above the list
- [ ] Type in the SearchBar, press Enter — facet chip appears, list reloads with filtered domain
- [ ] Click panel toggle — `SearchPanel` sidebar opens/closes with sections from `SearchModel.getSearchPanelSections()`
- [ ] Toggle a filter in `SearchPanel` — `SearchModel.toggleFilter` fires; list reloads
- [ ] Mount `WithSearch(ListController)` — no duplicate `SearchBar` (only from `ControlPanel`)

**Action manager**
- [ ] `Services.action.doAction({ type: 'ir.actions.act_window', res_model: 'res.partner', view_mode: 'list' })` triggers `ActionBus.trigger("ACTION_MANAGER:UPDATE", ...)` when OWL container is mounted
- [ ] `Services.action.doAction({ type: 'ir.actions.act_url', url: '/web#home' })` updates the hash
- [ ] `Services.action.doAction({ type: 'ir.actions.report', report_name: 'sale.report_saleorder', ids: [1] })` opens report URL
- [ ] `Services.action.getStack()` returns array with pushed entries

**Command palette**
- [ ] `Mod+K` opens the palette — 9 built-in commands visible
- [ ] `ArrowDown`/`ArrowUp` highlights items; `Enter` activates highlighted command
- [ ] `Alt+S` navigates to `#settings`
- [ ] `Alt+N` navigates to `/new` route or fires `ACTION_MANAGER:NEW_RECORD`

**Field widgets**
- [ ] Form view with `widget="radio"` on a selection field renders radio buttons
- [ ] Form view with `widget="progressbar"` on a float renders a CSS progress bar
- [ ] `AppCore.CoreFields.radio` accessible in DevTools

---

## Post-1.250.13 — View stack hardening: Gantt/Activity OWL + Discuss + route plugins + RelationalModel CRUD

### Pre-Deployment

- [ ] `core/release.py` version is `1.250.13`
- [ ] `npm run build:web` completes without error (`gantt_controller.js`, `activity_controller.js` in bundle)
- [ ] `python3 -m unittest tests.test_assets` passes — `route_apply_plugin_website.js`, `route_apply_plugin_ecommerce.js` in bundle URLs
- [ ] Open `test_runner.html` — `relationalModel` suite passes all 8 assertions

### Post-Deployment Verification

- [ ] Navigate to `#gantt_tasks` or `#tasks` with gantt view type — timeline renders (or skeleton if no data)
- [ ] Navigate to `#activity` — activity matrix renders with columns (or skeleton if no data)
- [ ] Navigate to `#discuss` — Discuss channel UI renders (not the old fallback)
- [ ] Navigate to `#website` — shows informational placeholder with "Open Products" button
- [ ] Navigate to `#ecommerce` — shows informational placeholder with "Open Sale Orders" button
- [ ] `window.__ERP_RELATIONAL_MODEL.create('res.partner', {name:'Test'})` resolves in DevTools

---

## Post-1.250.12 — Stabilize: debug cleanup + CSP revert + route dedup + CSS token audit

### Pre-Deployment

- [ ] `core/release.py` version is `1.250.12`
- [ ] No `fetch('http://127.0.0.1:7473')` calls in any JS file (run `grep -r "7473" addons/web/static/src`)
- [ ] `npm run build:web` completes without error
- [ ] `python3 -m unittest tests.test_assets tests.test_views_registry` all pass
- [ ] Open `test_runner.html` in browser — `test_routing_smoke` suite passes all assertions

### Post-Deployment Verification

- [ ] `GET /health` returns JSON with `status: ok` and `version` field
- [ ] `GET /readiness` returns 200 with `{"status":"ready"}` when DB is up, 503 when DB is down
- [ ] No `connect-src http://127.0.0.1:7473` visible in DevTools → Network → response headers
- [ ] Dark mode: search inputs in kanban/calendar/graph/pivot use border that respects dark theme
- [ ] Print preview: page background is white, text is dark regardless of theme

---

## Post-1.250.11 — Token hygiene + RPC resilience + route extraction + JS color audit

### Pre-Deployment

- [ ] `core/release.py` version is `1.250.11`
- [ ] `npm run check:assets-concat` passes (new JS plugins in bundle)
- [ ] `npm run build:web` completes without error
- [ ] `python3 -m unittest tests.test_assets tests.test_views_registry` all pass
- [ ] Open `test_runner.html` in browser — `test_rpc_resilience` passes all 3 assertions

### Post-Deployment Verification

- [ ] Navigate to `#reports/trial-balance` — report renders or shows informational fallback
- [ ] Navigate to `#settings/apikeys` — settings page renders or shows informational fallback
- [ ] Trigger a 502 from reverse proxy (or simulate) — client shows "non-JSON response" error, not opaque parse failure
- [ ] Remaining-days badges use design token colors (no raw hex visible in DevTools for `.o-remaining-days-*` rules)
- [ ] Dark mode: verify `--surface-secondary`, `--color-success-bg`, `--color-warning-bg`, `--color-danger-bg` all resolve (no transparent/invisible elements)
- [ ] Kanban column 10 border uses `var(--kanban-accent-10)` in DevTools
- [ ] `field_registry.js` color_picker input has no `value` attribute (uses browser default or token-set)

---

## Post-1.250.10 — Widget wiring + remaining_days + discuss route plugin + Alt+D + LoadingIndicator

### Pre-Deployment

- [ ] **`npm run check:assets-concat`** after `__manifest__.py` changes (discuss plugin added).
- [ ] **`npm run build:web`** after `loading_indicator.js` / `webclient.js` changes.

### Verification

- [ ] **`python3 -m unittest tests.test_views_registry tests.test_assets`** — widget attrs in list columns + discuss plugin in bundle.
- [ ] **`test_runner.html`** — shortcut contract suite (10 Alt+ keys, `alt+d` in modular); `field_registry` suite (remaining_days tests).
- [ ] Smoke: **Alt+D** (outside inputs) → `#discuss`; `res.partner` form shows email/phone input widgets; `sale.order` form shows monetary/date; project task form shows remaining_days badge.
- [ ] Smoke: top loading bar appears briefly during RPC (trigger via slow 3G network or `window.__ERP_LOADING.push()` in DevTools → bar visible; `.pop()` → bar hides).
- [ ] `window.__ERP_LOADING` exposed in DevTools console.

---

## Post-1.250.9 — ORM rpc race + res.partner boolean_toggle + Alt+G + #client-info

### Pre-Deployment

- [ ] **`npm run check:assets-concat`** / **`npm run build:web`** after **`orm.js`**, **`main.js`**, **`app/main.js`**, **`webclient_shortcut_contract.js`**, route plugins, or **`__manifest__.py`**.

### Verification

- [ ] **`python3 -m unittest tests.test_assets tests.test_views_registry`** — bundle lists **`route_apply_plugin_client_info.js`**; **`res.partner`** form **`is_company`** has **`boolean_toggle`** in registry.
- [ ] **`test_runner.html`** — shortcut contract suites.
- [ ] Smoke: **`#client-info`** and **Alt+G** (outside inputs) → **`#contacts`**; contact form shows company toggle control.

---

## Post-1.250.8 — OWL load Retry + rpc_deadline + keyboard-shortcuts route + Alt+R + boolean_toggle

### Pre-Deployment

- [ ] **`npm run check:assets-concat`** and **`npm run build:web`** after **`__manifest__.py`**, **`main.js`**, **`action_container.js`**, **`list_controller.js`**, **`form_controller.js`**, **`field_registry.js`**, **`webclient_shortcut_contract.js`**, or new **`rpc_deadline.js`** / **`route_apply_plugin_*.js`**.
- [ ] **`npm run test:css`** if **`webclient.css`** / SCSS tokens change.

### Verification

- [ ] **`python3 -m pytest tests/test_assets.py -q`** (bundle lists **`rpc_deadline.js`** + **`route_apply_plugin_keyboard_shortcuts.js`**).
- [ ] **`test_runner.html`** — **`field_registry`**, **`webclientShortcutContract`**, **`rpc_deadline`** suites.
- [ ] Smoke: **`#keyboard-shortcuts`** shows help + **Go to Home**; **Alt+R** outside inputs re-applies current route; OWL list (CSP allows OWL): stall **`search_read`** → error + **Retry** within **~25s**.

---

## Post-1.250.3 — List RPC deadline + selectApp debug + remove debug ingest

### Pre-Deployment

- [ ] **`npm run build:web`** / **`npm run check:assets-concat`** after edits to **`legacy_main_list_views.js`**, **`legacy_main_shell_routes.js`**, **`main.js`**, **`app/main.js`**, **`app/webclient.js`**, or **`webclient.css`**.

### Verification

- [ ] **`python3 -m unittest tests.test_main_js_route_consistency_phase631 tests.test_modern_action_contract_phase636`**
- [ ] Smoke: **`#home`** — click **two** app tiles; hash and **`#action-manager`** content update.
- [ ] Smoke: hard refresh on a **list** hash (e.g. **`#contacts`**) — either data loads or, if RPC is stalled, an error + **Retry** appears within **~25s** (not infinite skeleton).

---

## Post-1.250.2 — Navbar module + ORM cache invalidation + matrix 806–809

### Pre-Deployment

- [ ] **`npm run build:web`** / **`npm run check:assets-concat`** after edits to **`legacy_main_navbar_block.js`**, **`legacy_main_chrome_block.js`**, **`services/orm.js`**, **`field_registry.js`**, or **`__manifest__.py`**.

### Verification

- [ ] **`python3 -m unittest tests.test_main_js_route_consistency_phase631 tests.test_modern_action_contract_phase636`**
- [ ] **`test_runner.html`** — **`field_registry`** suite (includes production widget grep test).
- [ ] Smoke: navbar, notifications bell, company/lang dropdowns still work after chrome delegate change.

---

## Post-1.250.1 — Legacy import/reports split + webclient shortcuts + matrix 803–805

### Pre-Deployment

- [ ] **`npm run build:web`** after edits to **`legacy_main_import.js`**, **`legacy_main_reports.js`**, **`legacy_main_chrome_block.js`**, **`field_registry.js`**, **`relational_model.js`**, **`hotkey.js`**, **`webclient_shortcut_contract.js`**, or **`__manifest__.py`** asset order.
- [ ] **`npm run check:assets-concat`** — new legacy files are non-ESM IIFEs (concat-safe).

### Verification

- [ ] **`python3 -m unittest tests.test_main_js_route_consistency_phase631 tests.test_modern_action_contract_phase636`** — action/hash contracts unchanged.
- [ ] **`addons/web/static/tests/test_runner.html`** — **`field_registry`**, **`webclientShortcutContract`**, **`webclientShortcutContractModular`** pass.
- [ ] Smoke: list **Import** opens modal; **`#reports/trial-balance`** still loads (delegates to **`legacy_main_reports`**).

---

## Post-1.250 — Form WithSearch + route_apply plugins + optional boot debug

### Pre-Deployment

- [ ] **`npm run build:web`** after edits to `app/main.js`, `app/webclient.js`, `app/search/with_search.js`, `app/action_container.js`, `app/debug_boot.js`, or `core/webclient_shortcut_contract.js`.
- [ ] **`npm run check:assets-concat`** — `route_apply_registry.js` and legacy `main.js` remain concat-safe.

### Verification

- [ ] **URL:** exercise the shell at **`http://127.0.0.1:8069`** (or **`localhost:8069`**) **with port** — Safari “localhost” without port often mis-routes.
- [ ] **PWA / manifest:** **`GET /web`** is the manifest **`start_url`** and matches **`GET /`** (login redirect when logged out, web client shell when logged in).
- [ ] **Stale shell:** unregister **`/web/sw.js`** (PWA) when diagnosing cached bundles.
- [ ] **Header looks stacked / clicks dead on Home:** hard-refresh (**Cmd+Shift+R**); confirm **`webclient.css`** includes **`#navbar > .o-modern-navbar-slot`** flex rule (modern OWL slot must grow like **`.o-navbar-shell`**). If refresh never finishes, unregister the service worker (Safari → Develop → Service Workers) and retry **`http://127.0.0.1:8069`** with port.
- [ ] **OWL path (CSP allows eval, `cspScriptEvalBlocked: false`):** opening a **form** from **`ActionContainer`** shows **ControlPanel** + search bar above the form; domain changes propagate where **`SearchModel`** is non-stub.
- [ ] **Default CSP:** production behaviour unchanged — legacy list/form/kanban still canonical; **`FormWithSearch`** only applies when OWL mounts.
- [ ] **Discuss / reports / settings hashes:** `#discuss`, `#reports/trial-balance`, `#settings`, etc. still resolve (handled via **`installRouteApplyRegistryPlugins`** + **`phase631`** tests).
- [ ] Optional support: set **`localStorage.erp_debug_mode = "1"`**, reload — on shell **20s** timeout or modern boot throw, console shows **`[erp-debug-boot]`** JSON line.

### Strategic note (reaffirmed — Phase P4)

- **Precompiled OWL vs legacy-canonical:** unchanged from Post-1.249 — production default keeps **`cspScriptEvalBlocked: true`**; full precompile pipeline remains **product-scheduled**. See **`docs/odoo19-webclient-gap-table.md`** and **Phase P5** **`view_service`** scope (planning-only until milestone).

---

## Post-1.249 — Navigation reliability + route registry + OWL/CSP stance

### Strategic note (OWL + CSP — Phase D)

- **Production default:** `cspScriptEvalBlocked: true` in [`core/http/routes.py`](core/http/routes.py) `_webclient_html` → OWL **templates do not compile** under typical `script-src` without `unsafe-eval`. **`#action-manager`** uses **`ActionContainer.fallbackMount`**; **list/form/kanban content** is driven by **legacy** `main.js` + `loadRecords` / `renderForm`.
- **OWL ActionContainer + `_tryOwlRoute`:** Only active when bootstrap sets **`cspScriptEvalBlocked: false`** *and* HTTP **CSP** actually allows eval (dev/pilot). Do not flip the flag in production without matching CSP and a security review.
- **Future:** Precompiled OWL templates or a dedicated CSP policy remain **out of scope** until scheduled; track in [`docs/odoo19-webclient-gap-table.md`](docs/odoo19-webclient-gap-table.md).

### Pre-Deployment

- [ ] **`npm run build:web`** after touching `app/main.js`, `action_container.js`, or `services.js`.
- [ ] **`npm run check:assets-concat`** — includes new **`route_apply_registry.js`** in `web.assets_web`.
- [ ] **`bus_service.js`** is concat-listed in `web.assets_web` (no separate esbuild); restart server after edits so `/web/assets/web.assets_web.js` is regenerated if you use cached bundles.

### Verification

- [ ] **macOS + Postgres.app:** If the UI shows **Database erp does not exist** or **trust authentication** / **`::1`** errors while **`psql`** works, ensure **`erp`** exists (`erp-bin db init -d erp`) and either set **`PGHOST=127.0.0.1`** or rely on **1.250.5+** default **`db_host`**; restart Postgres.app or adjust **`pg_hba.conf`** if trust dialogs still fail ([Postgres.app permissions](https://postgresapp.com/l/app-permissions/)).
- [ ] **Alt+H** (outside inputs): navigates to `#home` (modular hotkey registration).
- [ ] **App tile** from Home leaves `.o-home-apps` and shows list/table or form in `#action-manager`.
- [ ] **App tile E2E (phase 811):** PRs run **`tests/e2e/test_app_tile_navigation_tour.py`** in **`e2e-pr-smoke`** (with portal tour). Locally: **`python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/test_app_tile_navigation_tour.py -v --e2e-base-url http://localhost:8069 --e2e-db erp`**
- [ ] **Form load (phase 810):** After **`npm run build:web`**, legacy form **`read`** / **`default_get`** use a **25s** client deadline with **Retry** (same spirit as list **`loadRecords`**).
- [ ] **Alt+/** on a **list** route focuses **`#list-search`** (phase **812**).
- [ ] **Bus longpolling:** No console “Fetch … `/longpolling/poll` … access control checks” — CSRF error responses must include CORS headers (`core/http/application.py` wraps security headers before CSRF); poll POST includes `csrf_token` in JSON when session cache has it.

### Local development quickstart (phase 817)

- [ ] Use the **macOS Terminal** (or integrated terminal) — **not** **`psql`**. The **`psql`** prompt looks like **`erp=#`**; shell commands such as **`cd`** and **`python3.11`** do nothing there. Exit **`psql`** with **`\q`** first.
- [ ] **Once per database:** from the project root **`erp-platform`**, run **`python3.11 erp-bin db init -d erp`** (or your Python 3.10+ with deps). You should see **`Database erp initialized.`** Warnings about **`ir.rule` / `model_id`** should be **gone** after **1.250.6** (**generic loader skips `ir.rule`**).
- [ ] **Start the web server** (keep the window open): **`python3.11 erp-bin --http-port=8069`**. If you see **`Address already in use`**, free the port: **`lsof -ti :8069 | xargs kill -9`**, then start again.
- [ ] **Browser:** **`http://127.0.0.1:8069/web/login?db=erp`** — default login **admin** / **admin** after a fresh init. Login HTML is **inline CSS only** (no **`webclient.css`** without tokens); if the form vanishes, hard-refresh and confirm the response has **`meta color-scheme light`**.
- [ ] **1.250.7:** **`session.getSessionInfo`** and **`view_service`** **`_jsonRpc`** use bounded **`fetch`** (abort after **15s** / **20s**); shell **`shell.load`** still has **20s** race in **`webclient.js`**.

---

## Post-1.248 — OWL action shell + webclient P3/P5

### Pre-Deployment

- [ ] **`npm run build:web`** — zero errors; bundle size within budget.
- [ ] **`npm run build:css`** — SCSS compiles (includes `shell/_overlays.scss`, `views/fields/_field_widgets_extra.scss`).
- [ ] **Optional:** **`npm run vendor:bootstrap`** — vend real Bootstrap 5.3.3 SCSS when network available (replaces stub under `addons/web/static/lib/bootstrap/scss/`).

### Verification

- [ ] With default bootstrap (`cspScriptEvalBlocked: true`): `window.__ERP_OWL_ACTION_CONTAINER_MOUNTED === false` and `#action-manager` has `data-erp-owl-fallback` (CSP fallback does **not** clear the node — legacy fills it). App menus still show **legacy** list/form (not blank).
- [ ] If you opt in to OWL views (`cspScriptEvalBlocked: false` in bootstrap only when CSP allows `unsafe-eval`): `__ERP_OWL_ACTION_CONTAINER_MOUNTED === true` and lists can use the OWL `ActionContainer` path.
- [ ] App tile → list opens (legacy path under default CSP; OWL path only when eval is explicitly allowed).
- [ ] **Mod+K** / **Ctrl+K** opens command palette from modular boot (`commandPalette.initHotkey`).
- [ ] List view from `ActionContainer` shows control panel / search chrome (`WithSearch`).

---

## Post–1.247 — Tracks O–S: Legacy Retirement, Backend Depth, Testing, Ops, Design (release 1.248.0)

### Pre-Deployment

- [ ] **`npm run build:web`** — bundle must be ≤ 400 KB, zero errors. Current: 299.2 KB ✓
- [ ] **`npm run build:css`** — SCSS compiles cleanly with Bootstrap stub (exit 0). ✓
- [ ] **`npm run test:css`** — Run SCSS smoke build for main.scss + dark.scss.
- [ ] **`npm run check:assets-concat`** — no ESM `export`/`import` in concat files.
- [ ] Python: `from core.tools.json_log import format_json_log, format_access_log` — import succeeds.
- [ ] HTTP: `GET /health` → 200 `{"status":"ok","service":"erp-platform"}`.
- [ ] HTTP: `GET /readiness` → 200 `{"status":"ready",...}` or 503 when DB not available (expected in test env without DB).

### Verification

- [ ] Console: `window.AppCore.WithSearch` defined (Track O1).
- [ ] Console: `window.AppCore.createSearchModel("res.partner")` returns an object with `getDomain`.
- [ ] Console: `window.AppCore.ViewService.loadViews` is a function (Track O4).
- [ ] Console: `window.AppCore.ActionBus.trigger("ACTION_MANAGER:UPDATE", { viewType: "list", resModel: "res.partner" })` — OWL ListController mounts (Track O2).
- [ ] Console: `window.AppCore.DialogService.confirm({ body: "Test?" })` opens OWL dialog (Track P3).
- [ ] `ERP_JSON_ACCESS_LOG=1` env var set: access logs emit JSON lines with `trace_id` to stdout (Track R2).
- [ ] `X-Request-ID` response header present in every HTTP response (Track R2).

### New Files (Tracks O–S)

| Module | File path |
|--------|-----------|
| O1 WithSearch HOC | `app/search/with_search.js` |
| O4 View service | `app/services/view_service.js` |
| P2 HR payslip stub | `addons/hr/models/hr_payslip.py` |
| Q1 OWL test runner | `addons/web/static/tests/owl_test_runner.html` |
| Q1 view registry tests | `addons/web/static/tests/test_owl_view_registry.js` |
| Q1 field registry tests | `addons/web/static/tests/test_owl_field_registry.js` |
| Q1 dialog service tests | `addons/web/static/tests/test_owl_dialog_service.js` |
| Q1 search bar tests | `addons/web/static/tests/test_owl_search_bar.js` |
| Q1 pager tests | `addons/web/static/tests/test_owl_pager.js` |
| Q2 E2E OWL views | `tests/e2e/test_owl_views_e2e.py` |
| P1 MRP SO test | `tests/test_mrp_so_driven_mo.py` |
| S1 Bootstrap stub | `addons/web/static/lib/bootstrap/scss/bootstrap.scss` |
| S1 Bootstrap functions | `addons/web/static/lib/bootstrap/scss/_bootstrap-functions.scss` |
| S1 vendor script | `scripts/vendor_bootstrap.js` |

### Modified Files (Tracks O–S)

| Module | File path |
|--------|-----------|
| O2 OWL route bridge | `addons/web/static/src/main.js` |
| O3 deprecation markers | `legacy_main_list_views.js`, `legacy_main_form_views.js`, `legacy_main_chart_views.js` |
| O1 searchModel prop | `app/views/list/list_controller.js` |
| O1 main imports | `app/main.js` |
| P1 workorder quant | `addons/mrp/models/mrp_workorder.py` |
| P2 employee lifecycle | `addons/hr/models/hr_employee.py` |
| P2 leave approval note | `addons/hr/models/hr_leave.py` |
| P2 payslip model | `addons/hr/models/__init__.py` |
| P3 confirm modal | `main.js`, `legacy_main_form_views.js` |
| R1 health probes | `core/http/routes.py` |
| R2 JSON logging | `core/tools/json_log.py`, `core/http/application.py` |
| S1 Bootstrap import | `addons/web/static/src/scss/main.scss` |
| S2 CSS migration | `scss/core/_dialog.scss`, `scss/search/_control_panel.scss`, `scss/views/kanban/_kanban_controller.scss`, `scss/webclient.css` |
| S2 test:css script | `package.json` |

### Notes

- OWL routing bridge (`_tryOwlRoute`) is opt-in: only activates when `viewRegistry` has a descriptor AND `#action-manager` DOM element exists. Legacy `loadRecords`/`renderForm` remain as fallback.
- Bootstrap stub at `lib/bootstrap/scss/` is a functional minimal reboot. Replace with real Bootstrap 5.3.3 source via `npm run vendor:bootstrap` (requires npm access).
- `hr.payslip` is a stub model — full payroll compute rules are deferred (gated per deferred_product_backlog.md).
- `ERP_JSON_ACCESS_LOG=1` activates JSON access logs; without it, logs are standard Python logging.
- `/readiness` expects DB access; returns 503 in CI environments without a live PostgreSQL instance (expected behaviour).

---

## Post–1.246 — Frontend Architecture Tracks I–N (release 1.247.0)

### Pre-Deployment

- [ ] **`npm run build:web`** — bundle must be ≤ 400 KB, zero errors. Current: 290.7 KB ✓
- [ ] **`npm run check:assets-concat`** — no ESM `export`/`import` in concat files.
- [ ] No new files added to `web.assets_web` (Tracks I–N are in `app/` ESM, built by esbuild).
- [ ] `npm install` to pick up `sass ^1.86.3` devDependency if running CSS build.
- [ ] **`npm run build:css`** (optional for SCSS pipeline) — requires `sass` installed.

### Verification

- [ ] Console: `window.AppCore.viewRegistry.getAll()` returns 6 descriptors (list, form, kanban, graph, pivot, calendar).
- [ ] Console: `window.AppCore.fieldRegistry.getAll()` returns ≥ 14 field descriptors.
- [ ] Console: `window.ERPFrontendRegistries.category("actions").has("settings")` returns `true`.
- [ ] Console: `window.AppCore.ActionBus` exists (K2 ActionBus pub/sub).
- [ ] Console: `window.Services.action.doAction({ type: "ir.actions.server", id: 1 })` does NOT throw `Unknown action type`.
- [ ] Light/dark toggle: dialog, dropdown, list, form, search panel all use CSS custom properties (no raw colors).
- [ ] `window.AppCore.DialogService.confirm({ title: "Test", body: "OK?" })` opens a modal.

### New Files (Track I–N)

| Module | File path |
|--------|-----------|
| I1 hooks | `app/core/hooks.js` |
| I2 dialog | `app/core/dialog.js` |
| I2 dropdown | `app/core/dropdown.js` |
| I2 notebook | `app/core/notebook.js` |
| I3 pager | `app/core/pager.js` |
| I3 autocomplete | `app/core/autocomplete.js` |
| I3 colorlist | `app/core/colorlist.js` |
| J1 view registry | `app/views/view_registry.js` |
| J2 list | `app/views/list/list_controller.js`, `list_renderer.js` |
| J3 form | `app/views/form/form_controller.js`, `form_renderer.js` |
| J4 kanban | `app/views/kanban/kanban_controller.js` |
| J4 graph | `app/views/graph/graph_controller.js` |
| J4 pivot | `app/views/pivot/pivot_controller.js` |
| J4 calendar | `app/views/calendar/calendar_controller.js` |
| K2 action container | `app/action_container.js` |
| K3 client actions | `app/client_actions.js` |
| L1 SCSS variables | `scss/_variables.scss`, `scss/main.scss` |
| L2 component CSS | `scss/webclient/`, `scss/views/`, `scss/search/`, `scss/core/` |
| L3 dark bundles | `*/_*.dark.scss` in each component folder, `scss/dark.scss` |
| M1 field wrapper | `app/views/fields/field.js` |
| M2 core fields | `app/views/fields/core_fields.js` |
| M3 relational fields | `app/views/fields/relational_fields.js` |
| N1 control panel | `app/search/control_panel.js` |
| N2 search bar | `app/search/search_bar.js` |
| N3 search panel | `app/search/search_panel.js` |

### Notes

- All Track I–N components are **ESM modules** in `app/`. They are bundled into `dist/modern_webclient.js` by `npm run build:web`. No new IIFE files added to `web.assets_web`.
- `services/action.js` (concat IIFE) extended with `ir.actions.server` and `ir.actions.client` registry resolution — backward compatible.
- `app/services.js` `createModernServices` is now properly `export`ed.
- SCSS pipeline is **opt-in**: existing `webclient.css` / `_tokens.css` / `_dark.css` remain. The new `scss/` tree is the migration target; `npm run build:css` produces `dist/webclient.css`.
- Dark mode pattern: `[data-theme="dark"]` + `*.dark.scss` per component replaces monolithic `_dark.css` for new components.

---

## Post–245 — Chrome block + design hardening + client layers (release 1.246.0)

### Pre-Deployment

- [ ] **`addons/web/__manifest__.py`:** `legacy_main_chrome_block.js` immediately **before** `main.js`; `notebook_widget.js` + `tags_list.js` with other components; search/model/view assets unchanged from 1.245 unless you rebased.
- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, **`npm run build:web:legacy`**.
- [ ] Smoke: import CSV modal, navbar (menus, systray, notifications), reports (`reports/trial-balance`, stock valuation, sales revenue), list bulk delete confirmation.

### Verification

- [ ] Console: `window.__ERP_CHROME_BLOCK` and `CHROME.install` ran (no errors on boot).
- [ ] Light/dark: notebook tabs, chat panel, navbar dropdowns use tokens (no raw `#fff` / `#ddd` in new paths).
- [ ] Optional: `UIComponents.TagsList.renderPills([{name:'A'}])` returns pill markup.

### Notes

- **`main.js`** ~1259 lines; chrome lives in **`legacy_main_chrome_block.js`**.
- Inline **`style=`** in `field_registry.js`, discuss shell, and chart fallback toolbars removed in favour of **`webclient.css`** classes.

---

## Post–244 — Deep main.js extraction + webclient architecture + backend hardening (release 1.245.0)

### Pre-Deployment

- [ ] Verify `addons/web/__manifest__.py` asset order: `orm.js` after `rpc.js`; four `legacy_main_*.js` files before `main.js`; `domain_selector.js` with components.
- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** (new extraction modules + ORM service).
- [ ] Python regressions: **`python3 -m unittest tests.test_sale_confirm_phase465 tests.test_account_post_phase467 tests.test_account_payment_phase468 -v`**.

### Verification

- [ ] JS: **`/web/static/tests/test_runner.html`** — form/list/chart/discuss views render via delegation to extraction modules.
- [ ] Verify `Services.orm.read('res.partner', [1], ['name'])` returns data in browser console.
- [ ] Verify `FieldWidgets.format('monetary', 1234.56, {currency: '€'})` returns formatted string.
- [ ] Verify `DomainSelector.render(container, {fields: {...}})` renders filter UI.

### New Files

- `services/orm.js` — Client ORM wrapper (Odoo 19 parity).
- `components/domain_selector.js` — Domain expression editor.
- `legacy_main_form_views.js` — Form CRUD extraction (1971 lines).
- `legacy_main_list_views.js` — List view extraction (618 lines).
- `legacy_main_chart_views.js` — Chart view extraction (1145 lines).
- `legacy_main_shell_routes.js` — Shell route extraction (830 lines).

### Notes

- **`main.js`** now 1847 lines (was 5378). All extracted functions accessible via `window.__ERP_FORM_VIEWS`, `__ERP_LIST_VIEWS`, `__ERP_CHART_VIEWS`, `__ERP_SHELL_ROUTES`.
- `core/tools` now exports `json_log`, `sql_debug`, `translate` in addition to existing helpers.

---

## Post–243 — Esbuild-primary default + legacy main split + gap docs (release 1.244.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** (**`legacy_main_route_*.js`**, **`legacy_main_parse_utils.js`**, **`app/home_module.js`** / **`app/router.js`**).
- [ ] If the host must keep the **single concat** **`web.assets_web.js`** tag, set **`ERP_WEBCLIENT_ESBUILD_PRIMARY=0`** on the server process (see **`docs/frontend.md`** Phase 801).

### Verification

- [ ] Python: **`python3 -m unittest tests.test_http.TestHTTP -v`** (esbuild default + **`=0`** concat + SW precache).
- [ ] JS: **`/web/static/tests/test_runner.html`** — spot-check list/form after route-table split.

### Notes

- **`docs/odoo19_core_gap_table.md`**, **`docs/*_odoo19_gap_audit.md`**, **`docs/main_js_extraction_catalog.md`**, **`docs/design_spec_coverage_audit.md`**, **`docs/design_system_a11y_audit.md`**.

---

## Post–242 — Parallel frontend (770–778) + action/report + search panel (release 1.243.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** (new **`erp_*_facade.js`**, **`list_view.js`** layout, view modules).

### Verification

- [ ] JS: **`/web/static/tests/test_runner.html`** — confirm **`field_registry`**, **`action_service`**, **`search_model`**, **`list_control_panel_search_panel`**, **`placeholder_view_modules`** pass.

### Notes

- **`ErpLegacyRouter`** / **`ErpBreadcrumbFacade`** expose legacy **`route`** / breadcrumb helpers for tooling; **`Services.action`** supports **`ir.actions.report`** and client registry.
- **647b** / **679:** Still **product-gated**.

---

## Post–241 — Phases 758–764 + B1–B4 + C1/C3 + ops smoke (release 1.242.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** (activity/discuss + placeholder view modules in **`app/main.js`**).
- [ ] Optional: **`bash scripts/smoke_public_routes.sh`** against a running server (expects **`/health`** + **`/metrics`**).

### Verification

- [ ] JS: **`/web/static/tests/test_runner.html`** — **`activity_view_module`**, **`discuss_view_module`**, **`placeholder_view_modules`** pass.
- [ ] Python: **`python3 -m unittest tests.test_stock_move_split_merge_phase771 tests.test_mrp_workorder_actions_phase781 tests.test_hr_contract_phase786 tests.test_hr_attendance_checkout_phase786 tests.test_ai_rag_normalize_phase791 tests.test_http.TestHTTP.test_ai_chat_stream_returns_501 -v`**

### Notes

- **758–764:** Activity/discuss extraction + settings/import/report shells; **`ERP_WEBCLIENT_ESBUILD_PRIMARY`** path unchanged (see **`docs/frontend.md`** Phase A4 gate).
- **B1–B4:** Stock split/merge; manual payment register; MRP workorder actions; **`hr.contract`** + **`hr.attendance.action_check_out`**.
- **C1/C3:** RAG long-text normalize; **`/ai/chat/stream`** returns **501** until streaming is implemented.
- **647b** / **679:** Still **product-gated** (see **`docs/deferred_product_backlog.md`** execution log).

---

## Post–240 — Phases 756–757 pivot + calendar modules + CSS token partials (release 1.241.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** (new view modules + **`_tokens.css`** / **`_dark.css`** in **`web.assets_web`**).

### Verification

- [ ] JS: **`/web/static/tests/test_runner.html`** — confirm **`pivot_view_module`** and **`calendar_view_module`** pass; spot-check light/dark theme and **`prefers-contrast: more`** after CSS split.

### Notes

- **757:** Token variables load from partials before component rules in **`webclient.css`**; no behaviour change intended.
- **647b** / **679:** Still **product-gated**.

---

## Post–239 — Phases 753–754 gantt + graph view modules (release 1.240.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`**.

### Verification

- [ ] JS: **`test_runner.html`** — **`gantt_view_module`** and **`graph_view_module`** suites pass.

### Notes

- **753–754:** Analytical views delegate to **`AppCore.*ViewModule.render()`**; inline fallbacks preserved.
- **647b** / **679:** Still **product-gated**.

---

## Post–238 — Phases 750–751 sale product fields + HR expense posting bridge (release 1.239.0)

### Pre-Deployment

- [ ] **751:** New column **`account_move.hr_expense_sheet_id`** — run **`db init`** / migration where schema sync is required.

### Verification

- [ ] Unit: `python3 -m unittest tests.test_sale_product_integration_phase750 tests.test_hr_expense_posting_phase751 -v`

### Notes

- **750:** Sale module adds Odoo-style sale flags on **`product.template`** (no separate **`npm run build:web`**).
- **751:** **`action_sheet_move_create`** shares logic with **`action_done`**; idempotent when **`account_move_id`** is already set.
- **647b** / **679:** Still **product-gated**.

---

## Post–237 — Phases 747–748 kanban module + stock.scrap (release 1.238.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`**, **`npm run build:web`**, and **`npm run build:web:legacy`** for **747** (**`kanban_view_module.js`** + bundles).
- [ ] **748:** New **`stock_scrap`** table / **`stock_move.scrap_id`** column — run **`db init`** or migration on environments that need schema sync.

### Verification

- [ ] Unit: `python3 -m unittest tests.test_stock_scrap_phase748 -v`
- [ ] JS: open **`/web/static/tests/test_runner.html`** and confirm **`kanban_view_module`** suite passes.

### Notes

- **747:** Kanban list view delegates to **`AppCore.KanbanViewModule.render()`** when **`ViewRenderers.kanban`** exists; inline fallback preserved.
- **748:** **`stock.scrap.action_validate`** creates a **`done`** **`stock.move`** so existing quant update hooks run on the source location.
- **647b** / **679:** Still **product-gated**.

---

## Post–236 — Phases 744–745 bank statement line + RAG pgvector gate (release 1.237.0)

### Pre-Deployment

- [ ] No **`npm run build:web`** required for **744–745** (Python + docs only).

### Verification

- [ ] Unit: `python3 -m unittest tests.test_account_bank_statement_line_phase744 tests.test_ai_vector_search_phase745 tests.test_pgvector_extension_installed_phase745 -v`

### Notes

- **744:** Statement lines gain optional multi-currency / reference fields and **`is_reconciled`** (computed from **`move_id`**).
- **745:** Semantic search uses **`<=>`** only when **`pg_extension.vector`** is installed **and** the chunk **`embedding`** column is native **`vector`**.
- **647b** / **679:** Still **product-gated**.

---

## Post–235 — Phases 741–743 registry verify + form module + stock.move.line (release 1.236.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`** and **`npm run build:web`** for **742** (**`form_view_module.js`** + **`modern_webclient.js`**).

### Verification

- [ ] Unit: `python3 -m unittest tests.test_auth_registry_recovery_phase739 tests.test_stock_move_line_phase743 -v`
- [ ] JS: open **`/web/static/tests/test_runner.html`** and confirm **`form_view_module`** suite passes (or run Playwright/CLI harness used for **`list_view_module`**).

### Notes

- **741:** Confirms **`_get_registry`** drops an empty cached registry and rebuilds (see **`test_auth_registry_recovery_phase739`**).
- **742:** Form rendering delegates to **`AppCore.FormViewModule.render()`** when present; **`wireFormViewAfterPaint`** keeps behaviour identical to the prior inline block.
- **743:** New **`stock.move.line`** table and ACL; run **`db init`** / migration on environments that need the column set.
- **647b** / **679:** Still **product-gated**.

---

## Post–234 — Phases 738–739 list module extraction + portal payment E2E (release 1.235.0)

### Pre-Deployment

- [ ] Run **`npm run check:assets-concat`** and **`npm run build:web`** for **738** (new list-view module asset + modern bundle import).
- [ ] Ensure portal/payment DB has at least one enabled provider; **739** pay-form route now falls back to SQL provider lookup if ORM provider reads come back empty.

### Verification

- [ ] JS target: `python scripts/with_server.py --server ".venv/bin/python erp-bin" --port 8069 -- .venv/bin/python3.14 -c "from playwright.sync_api import sync_playwright; import sys; pw=sync_playwright().start(); browser=pw.chromium.launch(headless=True); page=browser.new_page(); page.goto('http://localhost:8069/web/static/tests/test_runner.html'); page.wait_for_load_state('networkidle'); result=page.evaluate('window.Tests.list_view_module()'); print(result); browser.close(); pw.stop(); sys.exit(1 if result.get('fail') else 0)"`
- [ ] E2E: `python scripts/with_server.py --server ".venv/bin/python erp-bin" --port 8069 -- .venv/bin/python3.14 -m pytest tests/e2e/test_portal_invoice_payment_tour_phase739.py -q --e2e-db erp`

### Notes

- **Phase 738:** **`main.js`** delegates legacy fallback list rendering to **`AppCore.ListViewModule.render()`** when the extracted module is present; the inline fallback remains underneath for compatibility.
- **Phase 739:** Portal payment flow now has typed-route support for **`/my/invoices/<id>`** and **`/my/invoices/<id>/pay`**, fixed invoice detail links, and a CSRF token on the pay form.
- **CI:** **`e2e-pr-smoke`** runs the portal payment tour **and** **`test_app_tile_navigation_tour.py`** on pull requests (**phase 811**); the full **`tests/e2e/`** suite remains gated to main/master pushes.
- **647b** / **679:** Still **product-gated** — unchanged by **1.235.0**.

---

## Post–233 — Phases 735–736 AI conversation memory + account payment_state (release 1.234.0)

### Pre-Deployment

- [ ] No **`npm run build:web`** required for **735–736** (AI chat panel source + account model + docs only).

### Verification

- [ ] E2E: `python scripts/with_server.py --server ".venv/bin/python erp-bin" --port 8069 -- .venv/bin/python3.14 -m pytest tests/e2e/test_ai_chat_panel_conversation_phase735.py -q`
- [ ] Unit: `python3 -m unittest tests.test_account_move_payment_state_phase736 tests.test_account_payment_phase468 -v`

### Notes

- **Phase 735:** **`chat_panel.js`** now persists **`conversation_id`** from **`/ai/chat`** responses, so follow-up LLM prompts reuse prior conversation history.
- **AI checklist sync:** **`docs/ai-implementation-checklist.md`** now marks the shipped tool registry, retrieval, LLM chat, NL search, AI Fill, and conversation-memory rows as done.
- **Phase 736:** **`account.move.payment_state`** now computes **`not_paid`** / **`in_payment`** / **`partial`** / **`paid`** from residual + linked **`payment.transaction`** rows while keeping legacy **`state == "paid"`** behavior for compatibility.
- **647b** / **679:** Still **product-gated** — unchanged by **1.234.0**.

---

## Post–232 — Phase 734 write→done test + release 1.233.0

### Pre-Deployment

- [ ] No **`npm run build:web`** for **734** (tests + docs only).

### Verification

- [ ] With DB: `python3 -m unittest tests.test_payment_transaction_write_done_phase734 tests.test_portal_invoice_pay_phase199 tests.test_payment_transaction_invoice_db_phase733 -v`
- [ ] Optional: `python3 -m unittest tests.test_account_payment_phase468 tests.test_account_payment_record_phase470 -v`

### Notes

- **647b** / **679:** Still **product-gated** — unchanged by **1.233.0**.
- Shared helpers: **`tests/payment_test_bootstrap.py`**.

---

## Post–231 — Phase 733 payment DB tests + release 1.232.0

### Pre-Deployment

- [ ] No **`npm run build:web`** for **733** (tests + docs only).

### Verification

- [ ] With DB: `python3 -m unittest tests.test_portal_invoice_pay_phase199 tests.test_payment_transaction_invoice_db_phase733 -v`
- [ ] Optional: `python3 -m unittest tests.test_account_payment_phase468 tests.test_account_payment_record_phase470 -v`

### Notes

- **647b** / **679:** Still **product-gated** — unchanged by **1.232.0**.
- **Phase 199** checklist (below): demo pay path uses **731** sync; **733** adds in-test CoA bootstrap when default data has no sale journal / income / receivable (**1.233.0**: bootstrap lives in **`tests/payment_test_bootstrap.py`**).

---

## Post–230 — Phase 732 portal pay + release 1.231.0

### Pre-Deployment

- [ ] No **`npm run build:web`** for **732** (controllers + tests only).

### Verification

- [ ] With DB (same pattern as Phase **199**): `python3 -m unittest tests.test_portal_invoice_pay_phase199 -v`
- [ ] Optional: `python3 -m unittest tests.test_account_payment_phase468 tests.test_account_payment_record_phase470 -v`

### Notes

- **647b** / **679:** Still **product-gated** — unchanged by **1.231.0**.

---

## Post–229 — Phase 731 payment bridge + release 1.230.0

### Pre-Deployment

- [ ] No **`npm run build:web`** required for **731** (Python/tests/docs only) unless you also touch **`main.js`** / web assets in the same deploy.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_account_payment_phase468 tests.test_account_payment_record_phase470 tests.test_account_payment_stats_phase469 -v`
- [ ] Optional regression bundle: `python3 -m unittest tests.test_account_post_phase467 tests.test_account_payment_phase468 tests.test_account_payment_record_phase470 -v`

### Notes

- **647b** / **679:** Still **product-gated** — unchanged by **1.230.0**.

---

## Post–225 — Phases 693–694, 668 slice, 726, 647b doc + release 1.226.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`view_manager.js`**, **`main.js`**, or **`app/services.js`** changes (**693**–**694**).
- [ ] No DB migration for **726** if ORM sync applies; otherwise upgrade **stock** / **hr_expense** modules after pull.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_stock_picking_merge_safe_create_phase726 tests.test_hr_expense_merge_safe_create_phase726 tests.test_account_reconcile_allocation_phase577 -v`
- [ ] Browser: navigate two lists via **sidebar** — URL may gain **`?stack=`** when breadcrumbs are multi-level; reload should keep crumbs.
- [ ] **Staging / pilot — `ERP_WEBCLIENT_ESBUILD_PRIMARY=1`:** set env on the server process, restart, then smoke: login, open list + form, **Mod+K** command palette, confirm **`__erpFrontendBootstrap.esbuildPrimary`** is **true** in page source or bootstrap JSON. Compare asset load (per-file JS vs concat) against non-pilot host. Roll back by unsetting the variable. **CI** runs **`tests.test_http.TestHTTP`** esbuild + concat checks (**692**) and a **process-wide** env smoke (**727**: **`tests.test_esbuild_primary_process_env_phase727`** with **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`** exported for the step).
- [ ] **Phase 729 — Playwright / E2E:** On push to **main**/**master**, **CI** job **`e2e`** runs **`pytest tests/e2e/`** (see **`.github/workflows/ci.yml`**) including **`tests/e2e/test_login_list_form_tour.py`** (login → Contacts list → new contact form). Optional full asset matrix locally: **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1 python3 run_tests.py`** (longer run; same env as production pilot).
- [ ] **Phase 730 — Esbuild stress (optional CI):** Full suite under **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`** is **not** required in default **CI** (cost + flake risk). Use local **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1 python3 run_tests.py`** before promoting esbuild-primary to production templates; **CI** keeps **727** **`tests.test_esbuild_primary_process_env_phase727`** + **692** **`TestHTTP`** smokes.

---

## Post–224 — Phases 647+ partial, 681, 689–692 + release 1.225.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`**, **`app/services.js`**, or **`modern_webclient`**-affecting changes (**681**, **691**).
- [ ] No DB migration required for new **`account.reconcile.allocation`** columns if your environment uses ORM/schema sync on upgrade; otherwise run module **account** update so **`amount_currency`** / **`currency_id`** exist.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_main_js_route_consistency_phase631 tests.test_account_reconcile_allocation_phase577 -v`
- [ ] Browser: open a list from the **sidebar** twice from **different** routes with a non-empty breadcrumb stack — second route should **append** a crumb (unless same base slug).
- [ ] Optional: `python3 -m unittest tests.test_http.TestHTTP.test_webclient_html_esbuild_primary_env_lists_per_file_js_phase584 tests.test_http.TestHTTP.test_web_service_worker_precache_per_file_js_when_esbuild_primary_phase590 -v`

---

## Post–223 — Phases 680–688 + release 1.224.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`**, **`view_manager.js`**, **`empty_state.js`**, or **`webclient.css`** changes.
- [ ] No DB migration for **680–688**; **647+** FX unchanged (planned only).

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_main_js_route_consistency_phase631 tests.test_res_partner_merge_safe_create_phase685 -v`
- [ ] Browser: list **view switcher** (kanban/graph/…) still loads; **Website** tile → **Open Products** navigates to **`#products`**.

---

## Post–222 — Phases 668–679 + release 1.223.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`** / shortcut contract changes (**668**).
- [ ] No DB migration for **668–679**; **647+** FX unchanged (planned only).

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_main_js_route_consistency_phase631 tests.test_purchase_merge_safe_create_phase675 -v`
- [ ] Optional DB: `python3 -m unittest tests.test_confirm_draft_guard_phase478 tests.test_mrp_phase153 -v`
- [ ] Optional diff: `ODOO19_ADDONS=/path/to/odoo-19.0/addons bash scripts/diff_odoo_erp_addons.sh`; with **`ERP_DIFF_REQUIRE_CORE=1`**, script exits non-zero if **`web`**, **`sale`**, or **`account`** is missing from **`addons/`**.
- [ ] Browser: **Alt+K** on a list route still switches to kanban; action service stays in sync.

---

## Post–221 — Phases 658–667 + release 1.222.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`** changes (**658–659**).
- [ ] No DB migration for **658–667**; **647+** FX unchanged (planned only).

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_sale_confirm_side_effects_phase665 tests.test_purchase_receipt_domain_phase473 tests.test_sale_cancel_pickings_phase477 tests.test_purchase_cancel_pickings_phase476 -v`
- [ ] Optional: `ODOO19_ADDONS=/path/to/odoo-19.0/addons bash scripts/diff_odoo_erp_addons.sh` — expect large “Odoo only” list (localisation); ERP-only names should match **`docs/odoo19_erp_addon_inventory_audit.md`**.
- [ ] Browser: deep link to a list hash (e.g. bookmark **`#…`** for a model list) still loads data; with modern runtime, no navigation loop.

---

## Post–220 — Phases 648–657 + release 1.221.0

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`**, **`list_view.js`**, **`list_control_panel_shim.js`**, **`view_manager.js`**, or **`app/services.js`** changes.
- [ ] No DB migration for **648–657**; **647+** FX remains planning-only until product approves.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_schema_audit_columns tests.test_report_qweb_phase656 tests.test_record_rule_company_phase657 -v`
- [ ] No DB (regression): `python3 -m unittest tests.test_sale_invoice_phase466 tests.test_purchase_bill_phase471 tests.test_sale_confirm_phase465 -v`
- [ ] Browser: sidebar link with **`act_window`** updates hash; with modern shell bootstrapped, navigation still reaches the list client (**`doAction`** → hash → **`routeApplyInternal`**).
- [ ] Browser: list view renders filters / group-by / favourites bar (shim loaded before **`list_view.js`**).

---

## Post–219 — Phases 636–647 (action hub, async RPC contract, planned FX) (v1.220.0)

### Pre-Deployment

- [ ] **`npm run build:web`** after **`app/services.js`**, **`sidebar.js`**, or **`app/main.js`** changes.
- [ ] No DB migration for **636–646**; **647+** is planning-only until FX scope is approved.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_modern_action_contract_phase636 tests.test_ir_async_rpc_phase644 -v`
- [ ] No DB: `python3 -m unittest tests.test_sale_cancel_pickings_phase477 tests.test_purchase_cancel_pickings_phase476 -v` (regression for **640–643**)
- [ ] Browser: sidebar item with **`ir.actions.act_window`** — hash updates and legacy **`routeApply`** still run (primary click uses **`navigateFromMenu`**).
- [ ] Authenticated session (optional): **`GET /report/pdf_async/<report>/<ids>`** returns JSON **`queued`** when **`ir.async`** is loaded.

---

## Post–218 — Phases 630–635 (app routing parity, website/eCommerce placeholders, strict routing flag, 1.219.0) (v1.219.0)

### Pre-Deployment

- [ ] **`npm run check:assets-concat && npm run build:web`** after **`main.js`** changes.
- [ ] No DB migration for this wave.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_main_js_route_consistency_phase631 -v`
- [ ] Browser: from **#home**, open tiles **Website** and **eCommerce** — expect **empty-state** placeholders (not silent return to home).
- [ ] Optional QA: `window.__ERP_STRICT_ROUTING = true` — open an intentionally missing slug and confirm **Route not available** empty state instead of home.

---

## Post–215 — Phases 620–628 (kanban load-more parity, home layout, router test, 1.218.0) (v1.218.0)

### Ops note (empty registry / `Available: []`)

- If **`call_kw`** returns **500** and logs show **`Model … not found. Available: []`**, the ORM registry was built with a bad addons path (often after **`_get_registry`** overwrote config with cwd-relative **`addons`**). **Pull ≥ fix in `core/http/auth.py`**, then **restart the app server** (restart clears in-memory **`_registries`** cache). Run from project root or use an absolute **`--addons-path=`** on **`erp-bin server`**.

### Pre-Deployment

- [ ] **620–622:** `npm run check:assets-concat && npm run build:web`. Smoke: Kanban with **>20** cards in a column — **Load more** adds cards with the same chrome (`.o-kanban-card` when modern bundle registers **`KanbanCardChrome`**); checkbox on newly loaded row updates **bulk** bar.
- [ ] **623–626:** Smoke: **#home** — app tiles appear **above** the KPI strip; scrolling to **Dashboard** section still shows **`AppCore.Dashboard.render`** widgets (no KPI regression).

### Verification

- [ ] Browser: `/web/static/tests/test_runner.html` — **kanban_renderer** + **router** suites pass.

---

## Post–214 — Phases 614–619 (pivot/calendar chrome, ActionManager tests, RPC context merge, 1.215.0) (v1.215.0)

### Pre-Deployment

- [ ] **614–615:** `npm run check:assets-concat && npm run build:web`. Smoke: **Pivot** and **Calendar** views — toolbars use list-toolbar tokens; pivot table scrolls inside **`.o-pivot-container`**; calendar cells use **`.o-calendar-cell`** / event links.
- [ ] **616–618:** No DB migration; graph/pivot load failures show red text via **`var(--color-danger)`** (**`o-list-load-error`**).

### Verification

- [ ] Browser: `/web/static/tests/test_runner.html` — **action_manager_do_action_button** suite passes.
- [ ] No DB: `python3 -m unittest tests.test_merge_rpc_context_phase617`

---

## Post–213 — Phases 608–613 (SearchModel, graph chrome, field tokens, lock adviser test, 1.214.0) (v1.214.0)

### Pre-Deployment

- [ ] **608–610:** `npm run check:assets-concat && npm run build:web`. Smoke: open a list whose action defines **`search_default_*`** in context — initial facet chips appear; switch to another model’s list — facets reset; **Graph** view — toolbar uses tokenized buttons (no raw `#ddd` on type toggles when chrome loads).
- [ ] **611:** No schema change; optional DB unittest for adviser bypass.
- [ ] **612:** No extra migration; autocomplete dropdown only lists matching search-view fields.

### Verification

- [ ] Browser: `/web/static/tests/test_runner.html` — **search_model** + **field_registry** suites pass.
- [ ] With DB: `python3 -m unittest tests.test_account_lock_adviser_phase611`

---

## Post–212.1 — Phases 603–607 (kanban card, gantt/activity CSS, move currency, 1.213.0) (v1.213.0)

### Pre-Deployment

- [ ] **603–604:** `npm run check:assets-concat && npm run build:web`. Smoke: open **Kanban** on leads/tasks — cards show **gradient** shell + field strip; **Gantt** / **Activity** views (fallback paths) — toolbar buttons align with list token styles.
- [ ] **605:** `db upgrade` not strictly required if **`init_schema`** already ran (**602**); new moves inherit **`currency_id`** from journal when column exists.
- [ ] **606:** No manifest-only risk beyond concat order — run **`npm run check:assets-concat`**.

### Verification

- [ ] With DB: `python3 -m unittest tests.test_account_move_currency_from_journal_phase605`
- [ ] Browser: kanban drag/select still works (`.kanban-card` class retained on chrome path).

---

## Post–212.0 — Phase 602 (ORM schema sync on existing DB) (v1.212.1)

### Pre-Deployment

- [ ] **602:** No manual SQL required for typical upgrades: after pull, **restart `erp-bin`** once. Check logs for **`ORM schema sync completed for database`** (or a warning if sync failed).
- [ ] If you previously worked around missing columns with ad-hoc **`ALTER TABLE`**, reconcile with ORM: new columns from **`add_missing_columns`** should match models; resolve duplicate/constraints manually if you added conflicting DDL.

### Verification

- [ ] With DB: open accounting or any screen that queries **`account_move`** with **`company_id`** — no **`column "company_id" does not exist`** (after code that defines the field is deployed).

---

## Post–211 — Phases 597–601 (chatter chrome, dashboard polish, journal currency, shortcuts contract, list tokens) (v1.212.0)

### Pre-Deployment

- [ ] **597–598:** `npm run check:assets-concat && npm run build:web`. Smoke: open a CRM lead/project task/helpdesk form with **message_ids** — **Activity** header, chatter list + compose; home dashboard with no KPI widgets shows empty state; activity rows show deadline + model hint when `res_model` is present.
- [ ] **599:** `db upgrade` — new column **`account_journal.currency_id`** (nullable); existing journals keep NULL until edited (optional backfill from company currency in SQL if product requires).
- [ ] **600:** No DB migration; optional console check: `window.__ERP_WEBCLIENT_SHORTCUT_CONTRACT.alt.length === 6`.

### Verification

- [ ] With DB: `python3 -m unittest tests.test_account_journal_currency_phase599`
- [ ] Browser: `/web/static/tests/test_runner.html` — **webclientShortcutContract** suite passes.

---

## Post–210 — Phases 590–596 (parallel FE/BE: KPI RPC, PDF/a11y, SW v2, CRM static tests) (v1.211.0)

### Pre-Deployment

- [ ] **590–592:** `npm run check:assets-concat && npm run build:web`. Smoke: home KPI numbers load (RPC); **#pipeline** from first KPI card; list **Print** opens PDF overlay; form **Print** opens PDF overlay; **Esc** closes PDF/attachment modals; focus returns to trigger.
- [ ] **593:** **`CACHE` is `erp-web-shell-v3`** — no **`clients.claim()`** on activate (Safari-friendly); login/signup/TOTP pages **unregister** all SWs on load. Hard-refresh once after deploy if tabs were stuck.
- [ ] **594:** No DB migration; CRM config menus unchanged — unittest guards XML/model wiring.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_http.TestHTTP.test_web_service_worker_precache_per_file_js_when_esbuild_primary_phase590 tests.test_http.TestHTTP.test_web_service_worker_default_precache_includes_concat_js_phase590 tests.test_parallel_track_be_phase590`
- [ ] Browser: open `/web/static/tests/test_runner.html` — includes **pdf_viewer** suite.

---

## Post–209 — Phases 584–589 (navbar chrome, home KPI strip, esbuild-primary pilot, FE tokens, release) (v1.210.0)

### Pre-Deployment

- [ ] **584–585:** `npm install && npm run check:assets-concat && npm run build:web` → `addons/web/static/dist/modern_webclient.js`. Smoke: login, navbar glass search opens command palette (Mod+K still works), home shows KPI strip links.
- [ ] **586:** Staging only: set **`ERP_WEBCLIENT_ESBUILD_PRIMARY=1`** and verify shell (many `<script src="/web/static/...">` tags, **no** `/web/assets/web.assets_web.js`). Expect higher request count; service worker cache lists may need review if you precache concat JS.
- [ ] **587–588:** No DB migration; visual check light/dark + **prefers-reduced-motion** for route transitions.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_http.TestHTTP.test_webclient_html_esbuild_primary_env_lists_per_file_js_phase584` (with deps installed).
- [ ] Clear `ERP_WEBCLIENT_ESBUILD_PRIMARY` (or set `0`) for production unless staging sign-off is complete.

---

## Post–208 — Phases 574–583 (web slices, partial reconcile, stock valuation depth, sequence + lock adviser) (v1.209.0)

### Pre-Deployment

- [ ] **574–575:** After UI changes: `npm install && npm run check:assets-concat && npm run build:web` → `addons/web/static/dist/modern_webclient.js`.
- [ ] **576:** Do **not** set `ERP_WEBCLIENT_ESBUILD_PRIMARY=1` in production until shell regression (login, list control panel, form footer, breadcrumbs, kanban chrome, systray contract marker) passes on a staging template that loads esbuild-only entry.
- [ ] **577:** `db upgrade` — table **`account_reconcile_allocation`**; partial reconcile wizard uses **`allocate_amount`** (0 = auto min). FX not in this slice.
- [ ] **578–581:** `db upgrade` — **`stock_valuation_layer.lot_id`**; **`res_company.stock_valuation_allow_negative`** (default True); optional **`product_category`** account columns when `account` defines them.
- [ ] **582:** Ensure **`ir.sequence`** rows for `sale.order` / `purchase.order` / `account.bank.statement` are **per company** where multi-company applies.
- [ ] **583:** Set **`account_lock_adviser_group_id`** only for a trusted internal group if finance wants lock bypass for power users.

### Verification

- [ ] No DB: `python3 -m unittest tests.test_account_reconcile_allocation_phase577 tests.test_stock_valuation_post208_phase578_581`
- [ ] Optional: bank reconcile wizard smoke with two partial allocations then full close of statement line / move line.

---

## Wave O — Phases 555–559 (partner fiscal, SW shell cache, lock date, palette a11y, docs) (Unreleased)

### Pre-Deployment
- [ ] **555:** New column `res.partner.fiscal_position_id`; run `db upgrade` on existing DBs. SO/PO create defaults fiscal from partner unless explicitly set.
- [ ] **556:** Service worker caches concat bundle URLs — bump `CACHE` in `core/http/routes.py` `web_service_worker_stub` when shell assets change, or advise devs to unregister SW to avoid stale JS/CSS.
- [ ] **557:** `res.company.account_lock_date` — set only when finance wants to block posting on/before that date (first-company heuristic).
- [ ] **558:** No backend change; `npm run check:assets-concat` after `command_palette.js` edits.

### Verification
- [ ] Optional DB: `python -m unittest tests.test_account_fiscal_partner_default_phase555 tests.test_account_lock_date_phase557`
- [ ] No DB: `python -m unittest tests.test_http.TestHTTP.test_web_service_worker_has_static_cache_phase556`

---

## Wave N — Phases 550–554 (local DX, fiscal PO+invoice, RAG migrate doc, PWA SW stub, docs) (Unreleased)

### Pre-Deployment
- [ ] **CLI:** Remind operators: do not put `# comments` on the same shell line as `erp-bin` arguments (`argparse` will treat them as extra args).
- [ ] **Postgres without pgvector:** `db init` must complete with JSONB embedding columns; optional pgvector install is documented in README + embedding pipeline doc (Phases 550, 552).
- [ ] **Fiscal (551):** `purchase.order.fiscal_position_id` + `apply_fiscal_position_taxes()`; `account.move.fiscal_position_id` + `apply_fiscal_position_taxes()` for **draft** moves (line `tax_ids`).
- [ ] **RAG (552):** After enabling pgvector on an existing DB, follow migration / re-embed notes in `addons/ai_assistant/embeddings/pipeline.py` and optional `scripts/check_embedding_column.py`.
- [ ] **Web (553):** Service worker stub registers on `/web` shell only; offline is static/cache-limited, not full CRUD.

### Verification
- [ ] No DB: `python -m unittest tests.test_translate_discover_phase545` (translation discovery).
- [ ] Optional DB: `python -m unittest tests.test_account_fiscal_purchase_invoice_phase551`.
- [ ] No DB: `python -m unittest tests.test_http.TestHTTP.test_web_service_worker_stub_public_phase553`.

---

## Phases 539–544 (stock valuation subset, MRP cost lines, sale/purchase domains, web doc, RAG scope, account deferrals) (Unreleased)

### Pre-Deployment
- [ ] No new DB columns required for 539–544. **540:** MO cost draft moves may now include journal lines when chart has expense + current asset accounts.
- [ ] Cron `ai.rag.reindex` indexes **sale.order** in addition to partner/lead/knowledge — review load if many SOs (500 cap per model per run unchanged).

### Verification
- [ ] **ORM / `ir.rule`:** `search`, `search_count`, and `_read_group` now AND record-rule domains with the caller domain using nested `&` (list concat previously broke top-level `|` domains). Smoke-test any custom `ir.rule` on list views if you use OR domains.
- [ ] Optional DB (one run, not three): `./scripts/run_phases_539_541_db.sh` or `npm run test:phases-539-541-db` → `tests.test_phases_539_541_stock_mrp_sale_db`
- [ ] No DB: `tests.test_ai_rag_scope_phase543`
- [ ] Review `docs/frontend.md` Phase 542 and `docs/stock_odoo19_gap_audit.md` / `docs/account_odoo19_gap_audit.md` for planning alignment

---

## Phases 535–538 (account posting / tax / bank reconcile / reports note) (Unreleased)

### Pre-Deployment
- [ ] No schema change. Behaviour: posting rejects non-draft moves and lines without `account_id`.
- [ ] Sale/purchase flows that post invoices: confirm draft-only posting still matches expectations.

### Verification
- [ ] **Fast smoke (no DB, fewer module loads):** use `.venv/bin/python` if available; each listed **module** runs `load_module_graph()` once in `setUpClass`, so keep lists short for quick feedback:
  - Minimal (~3 graph loads): `tests.test_account_post_phase467`, `tests.test_account_post_phase535`, `tests.test_account_tax_compute_phase536`
  - Or run: `./scripts/run_account_wave_f_smoke.sh` or `npm run test:account-smoke` (same three modules)
- [ ] **Broader (no DB, 5 graph loads):** `./scripts/run_account_wave_f_broad.sh` or `npm run test:account-broad` (adds `tests.test_sale_invoice_phase466`, `tests.test_purchase_bill_phase471`).
- [ ] **Full + DB** (slowest; needs DB `_test_rpc_read`): `tests.test_bank_statement_phase193`, `tests.test_reconcile_wizard_phase195`, `tests.test_bank_statement_action_reconcile_phase537`, and optionally `tests.test_stock_partial_reserve_phase530`.

---

## Phases 530–534 (partial stock, MRP draft move, RAG breadth, planning rule) (Unreleased)

### Pre-Deployment
- [ ] `db upgrade` for new columns: `stock_move.quantity_reserved`, `mrp_production.cost_draft_move_id`.
- [ ] Agents/planners: read `docs/ai-rules.md` **Reference analysis** and keep `odoo-19.0` on disk + in workspace when comparing behaviour.
- [ ] Optional: smoke MO done with `account` + journal present — check draft `account.move` with `invoice_origin` `MFG:<MO name>` when `cost_estimate` > 0.

### Verification
- [ ] Optional DB: `tests.test_stock_partial_reserve_phase530`, `tests.test_ai_retrieve_chunks_phase532`

---

## Phases 525–529 (stock/MRP depth, concat guard, RAG embed, access logs) (Unreleased)

### Pre-Deployment
- [ ] `db upgrade` if upgrading from before Phase 526: `mrp.bom.operation` table and related columns.
- [ ] Before deploying web UI changes: `npm install && npm run check:assets-concat` (concat bundle must not contain ESM `export`).
- [ ] Build the modular runtime when packaging frontend changes: `npm run build:web` for `addons/web/static/dist/modern_webclient.js`.
- [ ] Structured access logs (optional): set `ERP_JSON_ACCESS_LOG=1` or start server with `--json-access-log`; ship `erp.http.access` lines to your log aggregator. Trace id: send `X-Request-Id` or `X-Trace-Id` header.
- [ ] RAG: ensure `OPENAI_API_KEY` (or your `_get_api_key` source) when using `index_record_for_rag` / chunk embedding refresh; run `CREATE EXTENSION vector` on PG when using pgvector (see `addons/ai_assistant/embeddings/pipeline.py`).

### Verification
- [ ] `GET /health?db=<name>` — liveness (always 200 JSON; `db` flag informational).
- [ ] `GET /readiness?db=<name>` — 200 when DB exists, **503** when missing (use for k8s readiness).
- [ ] Optional DB: `./.venv/bin/python -m unittest tests.test_mrp_bom_operations_phase526 tests.test_ai_chunk_embed_phase528 tests.test_stock_picking_phase525`

---

## Next phases 490+ (MRP, HR, web bundle, readiness) (Unreleased)

### Pre-Deployment
- [ ] After pull: run `python3 erp-bin db upgrade -d <db>` so new columns (`mrp.workorder`, `product.template.manufacture_on_order`, HR lifecycle fields, etc.) exist.
- [ ] Optional frontend rebuild: `npm install && npm run build:web` (see root `package.json`); modular runtime artefacts go to `addons/web/static/dist/`.
- [ ] Configure load balancers: `GET /health` **liveness**, `GET /readiness` **readiness** (503 if DB missing).

### Verification
- [ ] Smoke: confirm SO with **Manufacture on Order** + BOM creates MO; MO confirm → work order + reserved moves when quants exist; MO done adjusts quants; cancel clears moves + work orders.
- [ ] Smoke HR: onboarding → contract start → attendance check-in; approved leave shows `work_entry_note`; payslip `compute_sheet` includes attendance allowance when rules exist.
- [ ] Hit `/readiness?db=<name>` returns 200 when DB initialized.

---

## Sale confirmation helper chain + schema bootstrap (Unreleased)

### Pre-Deployment
- [ ] Run `python3 erp-bin db upgrade -d <db>` before deploying if the target database was initialized before the schema audit-column fix.
- [ ] Smoke sale confirmation on an environment with `sale`, `stock`, `account`, and `sale_purchase` loaded: confirm one sale order and verify no `super(type, obj)` crash occurs.
- [ ] Verify sale confirmation still applies pricelists, creates a draft delivery picking, queues the confirmation email, and updates invoice/delivery status fields.
- [ ] Smoke **Contacts:** create a partner; `contact_rank` should still increment (uses `res.partner._create_res_partner_record` under the hood).

### Verification
- [ ] Run focused regressions: `./.venv/bin/python -m unittest tests.test_schema_audit_columns tests.test_sale_confirm_phase465`
- [ ] Run sale-invoice regressions (empty invoice, draft duplicate skip, second draft when no draft dup): `./.venv/bin/python -m unittest tests.test_sale_invoice_phase466`
- [ ] Run posting-safety regression: `./.venv/bin/python -m unittest tests.test_account_post_phase467`
- [ ] Run payment-application regression: `./.venv/bin/python -m unittest tests.test_account_payment_phase468`
- [ ] Run payment-stats fallback regression: `./.venv/bin/python -m unittest tests.test_account_payment_stats_phase469`
- [ ] Run durable payment-record regression: `./.venv/bin/python -m unittest tests.test_account_payment_record_phase470`
- [ ] Run vendor-bill regressions (empty bills, draft duplicate skip, partial second bill): `./.venv/bin/python -m unittest tests.test_purchase_bill_phase471`
- [ ] Run purchase receipt-domain regression (received qty + `receipt_count`): `./.venv/bin/python -m unittest tests.test_purchase_receipt_domain_phase473`
- [ ] Run PO cancel / receipt cleanup regression: `./.venv/bin/python -m unittest tests.test_purchase_cancel_pickings_phase476`
- [ ] Run SO cancel / delivery cleanup regression (stock loaded): `./.venv/bin/python -m unittest tests.test_sale_cancel_pickings_phase477`
- [ ] Optional DB: draft-only confirm after cancel (PO + SO) — `./.venv/bin/python -m unittest tests.test_confirm_draft_guard_phase478` (skips if `_test_rpc_read` missing; PO test uses no lines to avoid One2many recompute quirks in harness)
- [ ] Optional DB: MRP cancel clears production moves — `./.venv/bin/python -m unittest tests.test_mrp_phase153.TestMrpPhase153.test_mrp_cancel_cancels_open_moves` (skips if DB missing)

---

## Missing sidebar apps / active=False (Unreleased)

### Pre-Deployment
- [ ] Run `db upgrade` or `db init` to re-seed menus with `active=True`: `python3 erp-bin db upgrade -d <db>`.
- [ ] Verify all 34 app root menus appear on the home page app grid.
- [ ] Verify `SELECT COUNT(*) FROM ir_ui_menu WHERE active = false` returns 0.

---

## Sidebar navigation / greyed-out menus (Unreleased)

### Pre-Deployment
- [ ] Run DB upgrade after CRM model `crm.lost.reason` and menu/action XML changes: `python3 erp-bin db upgrade -d <db>`.
- [ ] Hard-refresh web client (`main.js`); verify CRM **Configuration → Stages / Tags / Lost Reasons** open list views and are not greyed out.
- [ ] Verify **Expenses** app has no empty Configuration leaf; **Attendance → Kiosk** navigates to attendances list.
- [ ] Optional: `window.__ERP_DEBUG_SIDEBAR_MENU = true` in console, reload, confirm no unexpected `[sidebar] menu without route` warnings.

### Verification
- [ ] Hash routes `#crm_stages`, `#crm_tags`, `#crm_lost_reasons` load the corresponding models.

---

## Frontend Pro Max phases 451-464 (1.205.0)

### Pre-Deployment
- [ ] Hard-refresh web assets after deploy (`webclient.css`, `main.js`, `core/helpers.js`, `core/list_view.js`, `core/discuss.js`, new components/services).
- [ ] Confirm `web.assets_web` includes newly wired assets (`systray_registry`, `empty_state`, `onboarding_panel`, `pdf_viewer`, `attachment_viewer`, previously missing core/components files).
- [ ] Smoke systray async badge (`/web/async/call_notify`) and shortcut help modal.
- [ ] Verify onboarding panel render/fold persistence on `#home`.
- [ ] Verify report preview opens inline PDF modal from list/form and falls back to new tab when needed.
- [ ] Verify list drag reorder works on views using `widget="handle"` and persists sequence with RPC writes.
- [ ] Verify attachment image preview opens viewer overlay and closes with `Esc`.

### Verification
- [ ] JS unit suite passes at `/web/static/tests/test_runner.html` including:
  - [ ] `test_helpers_skeleton.js`
  - [ ] `test_systray_registry.js`
  - [ ] `test_onboarding_panel.js`
  - [ ] `test_attachment_viewer.js`

### Release
- [x] `core/release.py`: `1.205.0`

## Phases 437–450 (1.204.0)

### Pre-Deployment
- [ ] Run DB upgrade: `python3.11 erp-bin db upgrade -d <db>` (server-action route/runtime path changes, session context changes).
- [ ] Hard-refresh web assets (`core/helpers.js`, `core/search_model.js`, `core/list_view.js`, `core/field_registry.js`, `views/kanban_renderer.js`, `components/confirm_dialog.js`, `core/action_manager.js`, `main.js`).
- [ ] Validate `web.assets_web` includes `widgets/*.js` files (date/many2one/many2many/monetary/html/binary) after bundle rebuild.
- [ ] Smoke server-action execution from form header buttons (`type="object"` and `type="action"`).
- [ ] Verify wizard modal path for `ir.actions.act_window` with `target: "new"` opens modal and closes without route breakage.
- [ ] Verify company switch sets both current company and `allowed_company_ids` (`/web/session/set_current_company`) and list/form record rules still apply.
- [ ] Check async badge route `/web/async/call_notify` returns queue counters for logged-in users.

### Verification
- [ ] Browser JS unit suite passes at `/web/static/tests/test_runner.html` with new suites:
  - [ ] `test_search_model.js`
  - [ ] `test_field_registry.js`
  - [ ] `test_router.js`
  - [ ] `test_form_view.js`
  - [ ] `test_kanban_renderer.js`
  - [ ] `test_import.js`

### Release
- [x] `core/release.py`: `1.204.0`

---

## Phases 423–436 (1.203.0)

### Pre-Deployment
- [ ] Run DB upgrade: `python3.11 erp-bin db upgrade -d <db>` (new models: `ir.async`, `ir.property`, `report.paperformat`, `inter.company.rule`, scaffold bridge fields).
- [ ] Hard-refresh web assets (`core/router.js`, `core/navbar.js`, `core/sidebar.js`, `core/form_view.js`, `main.js`, `webclient.css`).
- [ ] Confirm cron worker can execute `ir.async.run_pending` and `ir.async.gc_done`.
- [ ] Validate report routes:
  - [ ] `/report/pdf/<report>/<ids>` still renders for existing reports
  - [ ] `/report/pdf_async/<report>/<ids>` returns queued job id
- [ ] If attachment caching for reports is enabled (`attachment_use`), verify `ir.attachment` rows are created/updated for report PDFs.
- [ ] Multi-company smoke: ensure session context includes `allowed_company_ids` and list/form visibility respects company scoping.
- [ ] Optional: install/enable `inter_company_rules` and configure at least one source/target company rule before testing SO->PO mirroring.

### Verification
- [x] Python syntax checks pass for modified backend modules (`py_compile` run).
- [x] Added phase 436 tests execute (`python3.11 -m unittest tests.test_e2e_business_flows_phase436 tests.e2e.test_smoke`) with environment-dependent skips.

### Release
- [x] `core/release.py`: `1.203.0`

---

## Phases 409–422 (1.202.0)

### Pre-Deployment
- [ ] Run `python3.11 erp-bin db upgrade -d <db>` so `ir_model_data`, `ir_model_fields`, and generic XML data apply cleanly.
- [ ] Optional demo: `python3.11 erp-bin db init -d <db> --demo` or set `ERP_LOAD_DEMO=1` before init.
- [ ] Hard-refresh web client (`form_view.js`, `discuss.js`, `select_create_dialog.js`, `command_palette.js`, `import.js`, `graph_*` / `pivot` / `calendar` / `gantt` / `activity` views, `main.js`).
- [ ] If using geolocation, ensure outbound HTTPS to Nominatim is allowed (or rely on deterministic fallback).

### Release
- [ ] `core/release.py`: `1.202.0`

---

## Next phases / Odoo parity (1.201.0)

### Pre-Deployment
- [ ] Run DB upgrade so new models/columns load: `mail.followers`, `mail.tracking.value`, `ir.sequence` fields, `ir.sequence.date_range`, `ir.cron` failure fields, `ir_attachment.store_fname`, etc.
- [ ] Hard-refresh static assets (`field_registry.js`, `search_model.js`, `action_manager.js`, `confirm_dialog`, `control_panel`, `list_view`, `kanban_renderer`, `main.js`, `webclient.css`).
- [ ] Optional filestore: set config `attachment_location=file` and `data_dir` (or `filestore_path`); ensure write permissions on filestore directory.
- [ ] Cron: single-process server now runs an in-process cron thread; prefork mode still uses separate cron worker. Verify `LISTEN/NOTIFY` is allowed on PostgreSQL if using `_trigger`.

### Release
- [ ] `core/release.py`: `1.201.0`

---

## Missing apps parity rollout (1.200.0)

### Pre-Deployment
- [ ] Run DB upgrade to load new menu/action XML records: `python3.11 erp-bin db upgrade -d <db>`.
- [ ] Hard-refresh browser after deploy (`main.js` route matrix expanded; app roots changed).
- [ ] Verify app grid now includes CRM (not only Leads) and Discuss as app tiles.
- [ ] Verify promoted HR apps appear as top-level apps: Expenses, Attendances, Recruitment, Time Off.
- [ ] Verify standalone Analytic tile is gone; analytic menus appear under Invoicing > Configuration.
- [ ] Smoke routes: `#pipeline`, `#crm/activities`, `#expenses`, `#attendances`, `#recruitment`, `#time_off`.
- [ ] Smoke scaffolded app routes: `#repair_orders`, `#surveys`, `#lunch_orders`, `#livechat_channels`, `#project_todos`, `#recycle_models`, `#skills`, `#elearning`.
- [ ] Restart server and validate app-grid + sidebar behavior end-to-end.

### Verification
- [x] `python3 -m unittest tests.test_missing_apps_parity_phase408`

### Release
- [ ] `core/release.py`: `1.200.0`

---

## Working menu + apps home launcher (1.199.0)

### Pre-Deployment
- [ ] Run DB upgrade to reload menu hierarchy updates: `python3.11 erp-bin db upgrade -d <db>`.
- [ ] Hard-refresh browser after deploy (`main.js` routing/home/nav behavior + new app-grid CSS changed).
- [ ] Verify `#home` shows app tiles and clicking a tile routes to that app's default screen.
- [ ] Verify navbar logo and `Apps` button route to `#home` and current app label updates by route.
- [ ] Verify sidebar shows only selected app sections and links for Taxes, Payment Terms, Pricelists, Bank Statements, Reordering Rules, Analytic Accounts, Analytic Plans are routable.
- [ ] Smoke route forms/lists for `#invoices`, `#taxes`, `#payment_terms`, `#pricelists`, `#reordering_rules`, `#analytic_accounts`.
- [ ] Restart server after deployment and confirm it binds on `http://127.0.0.1:8069`.

### Release
- [ ] `core/release.py`: `1.199.0`

---

## Frontend/Backend roadmap scaffold (1.198.0)

### Pre-Deployment
- [ ] Hard-refresh browser (new service/component/core assets added before `main.js`).
- [ ] Verify command palette hotkey `Ctrl/Cmd+K` opens and route navigation works.
- [ ] Verify debug toggle button appears in navbar and persists state.
- [ ] Verify PWA manifest is served at `/web/static/manifest.webmanifest` and service worker registration succeeds.
- [ ] Smoke sidebar/navbar/list/form/report routes to ensure legacy renderers still execute when core stubs return `false`.
- [ ] Verify `fetchmail.server` model is readable/writable and ACL is loaded.
- [ ] Verify bus longpolling/websocket fallback still works after `bus_service.js` changes.
- [ ] Run DB migration/bootstrap and verify `_log_access` audit columns are present on newly created tables.

### Release
- [ ] `core/release.py`: `1.198.0`

---

## Sidebar Odoo 19.0 parity (2026-03-20)

### Pre-Deployment
- [ ] Hard-refresh browser after deploy (sidebar HTML structure changed in `main.js`, new CSS tokens in `webclient.css`, menu caching in `views.js`).
- [ ] Smoke sidebar: categories fold/unfold, fold state persists across refresh (`erp_sidebar_folds` in localStorage).
- [ ] Verify active link highlights on navigation and auto-expands parent category.
- [ ] If `web_icon` / `web_icon_data` are set on menu records, verify icons render (img or FA icon).
- [ ] Verify recursive sub-menus render for menus with 3+ nesting levels.
- [ ] Check menu caching: first load populates `erp_menus` in localStorage; offline/error falls back to cache.
- [ ] Verify `active = False` menus are excluded from sidebar.

### New localStorage Keys
- `erp_sidebar_folds` — JSON object: `{ menuId: true/false }` for per-category fold state.
- `erp_menus` — Cached menu JSON from last successful load.
- `erp_menus_hash` — Hash of cached menus for invalidation.

### New DB Fields
- `ir_ui_menu.web_icon` (VARCHAR) — icon class or module path.
- `ir_ui_menu.web_icon_data` (VARCHAR) — base64 data URI for custom icon.
- `ir_ui_menu.active` (BOOLEAN, default TRUE) — soft-delete flag.

### Release
- [ ] `core/release.py`: `1.181.0`

---

## List view componentization (2026-03-20)

### Pre-Deployment
- [ ] Hard-refresh browser after deploy (`control_panel.js`, `view_switcher.js`, `pager.js`, `bulk_action_bar.js`, `core/list_view.js` before `main.js`).
- [ ] Smoke list pages: search, AI search, sort, grouping, saved filters, stage filter (`crm.lead`), bulk delete, CSV/XLSX export, pager, row keyboard navigation.

### Release
- [ ] `core/release.py`: `1.180.0`

---

## Settings page componentization (2026-03-20)

### Pre-Deployment
- [ ] Hard-refresh browser after deploy (`settings_field.js`, `settings_table.js`, `settings_section.js`, `core/settings.js` before `main.js`).
- [ ] Smoke: Settings index (company, params, AI, mail), Dashboard Widgets CRUD, API Keys generate/revoke, TOTP enable/disable (QR script already on layout).

### Release
- [ ] `core/release.py`: `1.179.0`

---

## Collapsible sidebar navigation (2026-03-20)

### Pre-Deployment
- [ ] Template includes `#app-sidebar`, `.o-app-main-column`, `o-sidebar-backdrop`.
- [ ] After deploy: verify desktop collapse toggle and mobile drawer + Escape to close.

### Release
- [ ] `core/release.py`: `1.178.1`

---

## Dashboard & home UI redesign (2026-03-20)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase378_389 tests.test_phase366_377 tests.test_phase354_365 -v`
- [ ] Hard-refresh browser after deploy (new JS bundle order).

### Deliverables
- Spec: `design-system/specs/dashboard-home.md`; `design-system/MASTER.md` dashboard section.
- Components: `kpi_card.js`, `activity_feed.js`, `shortcuts_bar.js`, `recent_items.js`; `core/dashboard.js` renderer.
- Assets: `web.assets_web` includes new scripts before `main.js`; `webclient_templates.xml` aligned for standalone HTML.
- Styles: `webclient.css` dashboard grid, trends, timeline, AI skeleton, drawer, badge variants.

### Config / release
- [ ] `core/release.py`: `1.178.0`

---

## Runtime Stability Fixpack (2026-03-20)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase378_389 -v`
- [ ] Restart app server after deploy to load JS bundle and backend dashboard fix.

### Included fixes
- Dashboard widget API (`ir.dashboard.widget/get_data`) handles both tuple and dict cursor rows (prevents repeated 500s).
- Hash-route action resolution now traverses nested menus before fallback route rendering.
- Bus service defaults to longpolling in local dev to prevent repeated WebSocket handshake errors in browser console.

---

## Phases 378-389 - Modularization + Backend Enrichment + l10n Wave 5 (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase378_389 -v`
- [ ] Run schema init/upgrade on target DB for new localization modules.

### Frontend modularization (378-381)
- New extraction modules in `addons/web/static/src/core/`: `router.js`, `view_manager.js`, `dashboard.js`, `settings.js`, `chatter.js`, `field_utils.js`.
- `main.js` wired to core module availability for incremental extraction.

### Backend enrichment (382-385)
- HR presence/holidays stub methods implemented.
- Mail template Many2one recipient resolution implemented.
- `res.lang` i18n metadata fields and `ir.model` metadata relation fields added.
- MRP expiry helpers and base geolocalization logic implemented.

### New modules (386-389)
- `l10n_bo`, `l10n_cr`, `l10n_uy`, `l10n_ve`, `l10n_ph`
- `l10n_id`, `l10n_vn`, `l10n_pk`, `l10n_ng`, `l10n_ma`
- `l10n_il`, `l10n_hr`, `l10n_rs`, `l10n_si`, `l10n_lu`
- `l10n_lt`, `l10n_lv`, `l10n_ua`, `l10n_fi`, `l10n_gr`

### Config / release
- [ ] `core/tools/config.py`: phase `386-389` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.177.0`

---

## Phases 366-377 - Frontend Implementation + l10n Wave 4 (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase366_377 -v`
- [ ] Run schema init/upgrade on target DB for new l10n models.

### Frontend implementation (366-373)
- `addons/web/static/src/widgets/`: many2one, many2many, date, monetary, binary, html widgets implemented.
- `addons/web/static/src/components/`: button, card, badge, avatar, modal, toast implemented as DOM components.
- `addons/web/static/src/layout/`: navbar, sidebar, action layout implemented.
- `addons/web/static/src/views/calendar_renderer.js`, `gantt_renderer.js` implemented with mode/scale support.

### New modules (374-377)
- `l10n_ar`, `l10n_cl`, `l10n_co`, `l10n_pe`, `l10n_ec`
- `l10n_ae`, `l10n_sa`, `l10n_eg`, `l10n_za`, `l10n_ke`
- `l10n_cn`, `l10n_kr`, `l10n_tw`, `l10n_sg_full`, `l10n_th`
- `l10n_cz`, `l10n_hu`, `l10n_ro`, `l10n_bg`, `l10n_pt`

### Config / release
- [ ] `core/tools/config.py`: phase `374-377` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.165.0`

---

## Phases 354-365 - Deferred Wave 3 + UI/UX Agent Track (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase354_365 -v`
- [ ] Run schema init/upgrade on target DB for new l10n/theme models.

### New modules (354-359)
- `l10n_es`, `l10n_it`, `l10n_nl`, `l10n_be`, `l10n_ch`
- `l10n_at`, `l10n_in`, `l10n_br`, `l10n_mx`, `l10n_au`
- `l10n_ca`, `l10n_pl`, `l10n_se`, `l10n_no`, `l10n_dk`
- `theme_default`, `theme_starter_1`, `theme_starter_2`, `theme_starter_3`, `theme_starter_4`

### UI/UX track artifacts (360-365)
- `design-system/MASTER.md`, `docs/design-system.md`
- `addons/web/static/src/components/` (button/card/badge/avatar/modal/toast)
- `addons/web/static/src/layout/` (navbar/sidebar/action layout)
- `addons/web/static/src/views/calendar_renderer.js`, `gantt_renderer.js`
- `addons/web/static/src/widgets/` widget stubs
- `.cursor/rules/agents/ui-designer.mdc`, `.cursor/rules/agents/frontend-builder.mdc`

### Config / release
- [ ] `core/tools/config.py`: phase `354-359` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.153.0`

---

## Phases 342-353 - Deferred Categories Wave 2 (payments, POS payment bridges, Google/MS, spreadsheet, cloud/iot, starter l10n) (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase342_353 -v`
- [ ] Run schema init/upgrade on target DB for new models introduced in phases 342-353.

### New modules (342-353)
- `payment_stripe`, `payment_paypal`, `payment_adyen`, `payment_authorize`
- `payment_mollie`, `payment_razorpay`, `payment_custom`, `payment_demo`
- `pos_adyen`, `pos_stripe`, `pos_restaurant_adyen`
- `google_calendar`, `google_drive`, `microsoft_calendar`, `microsoft_outlook`
- `spreadsheet`, `spreadsheet_dashboard`, `spreadsheet_account`
- `spreadsheet_dashboard_account`, `spreadsheet_crm`, `spreadsheet_dashboard_crm`
- `cloud_storage`, `iot`
- `l10n_generic_coa`, `l10n_us`, `l10n_uk`, `l10n_de`, `l10n_fr`

### Config / release
- [ ] `core/tools/config.py`: phase `342-353` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.142.0`

---

## Phases 330-341 - Deferred Categories Wave 1 (mass mailing, livechat, website content, POS sub-modules) (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase330_341 -v`
- [ ] Run schema init/upgrade on target DB for new models introduced in phases 330-341.

### New modules (330-341)
- `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`
- `mass_mailing_sms`, `mass_mailing_themes`
- `im_livechat`, `crm_livechat`, `hr_livechat`, `website_livechat`
- `website_blog`, `website_forum`, `website_slides`, `hr_skills_slides`
- `pos_discount`, `pos_loyalty`, `pos_sale`, `pos_sale_loyalty`
- `pos_sale_margin`, `pos_hr`, `pos_restaurant`, `pos_hr_restaurant`
- `pos_restaurant_loyalty`, `pos_mrp`, `pos_event`, `pos_event_sale`
- `pos_sms`, `pos_self_order`, `pos_online_payment`, `pos_account_tax_python`

### Config / release
- [ ] `core/tools/config.py`: phase `330-341` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.136.0`

---

## Phases 320-329 - Final parity stretch (accounting EDI, website tracks/sale, CRM bridges, delivery and misc) (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase320_329 -v`
- [ ] Run schema init/upgrade on target DB for new models introduced in phases 320-329.

### New modules (320-329)
- `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_add_gln`
- `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`
- `account_tax_python`, `account_update_tax_tags`, `sale_edi_ubl`, `purchase_edi_ubl_bis3`
- `website_event_track`, `website_event_track_quiz`, `website_event_track_live`, `website_event_track_live_quiz`
- `website_event_exhibitor`, `website_event_booth_exhibitor`, `website_event_booth_sale_exhibitor`
- `website_sale_loyalty`, `website_sale_mrp`, `website_sale_autocomplete`, `website_sale_stock_wishlist`
- `website_sale_collect`, `website_sale_collect_wishlist`, `website_crm_sms`, `website_cf_turnstile`
- `website_crm_iap_reveal`, `website_crm_partner_assign`, `website_mail_group`, `crm_iap_mine`
- `delivery_mondialrelay`, `website_sale_mondialrelay`, `sale_gelato`, `sale_gelato_stock`, `website_sale_gelato`
- `hr_recruitment_survey`, `project_mail_plugin`, `attachment_indexation`, `certificate`

### Config / release
- [ ] `core/tools/config.py`: phase `320-329` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.131.0`

---

## Phases 308-319 - Infrastructure, website commerce, auth/mail and CRM extensions (2026-03-19)

### Pre-Deployment Steps
- [x] Run tests: `python3.11 -m unittest tests.test_phase308_319 -v`
- [ ] Run schema init/upgrade on target DB for new models and relations introduced in phases 308-319.

### New modules (308-319)
- `barcodes`, `barcodes_gs1_nomenclature`, `base_iban`, `base_vat`
- `board`, `http_routing`, `html_editor`, `html_builder`
- `product_matrix`, `product_email_template`, `sale_product_matrix`, `purchase_product_matrix`
- `sale_pdf_quote_builder`, `delivery_stock_picking_batch`, `stock_fleet`, `mrp_subcontracting_dropshipping`
- `auth_ldap`, `auth_passkey`, `auth_passkey_portal`, `auth_timeout`
- `mail_group`, `mail_plugin`, `snailmail`, `snailmail_account`
- `event_booth`, `event_booth_sale`, `website_event`, `website_event_sale`
- `website_event_crm`, `website_event_booth`, `website_event_booth_sale`, `project_mrp_stock_landed_costs`
- `website_sale_stock`, `website_sale_wishlist`, `website_sale_comparison`, `website_sale_comparison_wishlist`
- `website_customer`, `website_partner`, `website_profile`, `website_hr_recruitment`
- `iap_crm`, `crm_iap_enrich`, `crm_mail_plugin`, `marketing_card`
- `sms_twilio`, `web_unsplash`, `base_sparse_field`, `base_import_module`, `base_install_request`, `partnership`

### Config / release
- [ ] `core/tools/config.py`: phase `308-319` entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.126.0`

---

## Phases 296–307 – MRP/Project/HR alignment + sale/auth/stock/website cluster (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase296_307 -v`
- [ ] Confirm Postgres schema init after new `Many2many` / `stock.picking.batch` tables (fresh `db init` or migration as per your process)

### Validation Update (2026-03-19)
- [x] `python3.11 -m unittest tests.test_phase296_307 -v` passed (`13` tests, `0` failures)
- [x] Bridge compatibility fields aligned for p302-p306 (`sale_purchase_project_auto_count`, `sms_reminder_ids`, `portal_password_policy_level`, `maintenance_request_id`, `web_hierarchy_parent_field`)
- [x] `website_mail` import/load issue resolved (`models/res_company.py`, `models/__init__.py`)

### Field / module highlights (296–301)
- Landed costs ↔ MO: `landed_cost_ids` / `mrp_production_ids`; subcontracting landed `subcontracting_production_ids`
- Subcontracting: `subcontracting_account_move_count`, `is_subcontract_line`, `subcontract_move_id`
- Project: computed counters + `production_cost`, `project_production_ids`, `project_stock_valuation_count`
- HR: work entry ↔ leave types, attendance on leave, homeworking locations, TOTP/password portal bridges, recruitment SMS thread

### New modules (302–307)
- **p302**: `sale_purchase_project`, `sale_project_stock`, `sale_mrp_margin`, `sale_stock_product_expiry`
- **p303**: `calendar_sms`, `resource_mail`, `survey_crm`, `event_crm_sale`, `mail_bot`
- **p304**: `auth_password_policy_portal`, `auth_password_policy_signup`, `auth_totp_mail`, `auth_totp_portal`
- **p305**: `stock_maintenance`, `stock_picking_batch`, `purchase_repair`, `stock_dropshipping`
- **p306**: `web_hierarchy`, `website_mail`, `website_sms`, `website_links`
- **p307**: `website_project`, `website_timesheet`, `hr_skills_event`, `hr_skills_survey`, `mail_bot_hr`, `hr_org_chart`

### Config / release
- [ ] `core/tools/config.py`: p302–p307 entries present in `DEFAULT_SERVER_WIDE_MODULES`
- [ ] `core/release.py`: `1.120.0`

---

## Phases 289–295 – Event, Website, Inventory/Sale Bridges, Product & Base (Cluster E) (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase289_290 tests.test_phase291_295 -v`

### New Modules
- `addons/event_crm`: registrations ↔ CRM leads
- `addons/event_sale`: sale lines ↔ events/tickets
- `addons/website_crm`: lead website source fields (`website_id`, `website_form_url`)
- `addons/website_payment`: payment providers on websites
- `addons/account_fleet`: `account.move.line.vehicle_id` + `fleet.vehicle.invoice_count`
- `addons/stock_sms`: `stock.picking.sms_ids/sms_count` + `sms.sms.picking_id`
- `addons/stock_delivery`: `stock.picking.carrier_id`, `carrier_tracking_ref`, `weight`
- `addons/sale_expense_margin`: `hr.expense.margin` computed from linked `sale.order.margin`
- `addons/sale_loyalty_delivery`: minimal `loyalty.reward` (`reward_type`, `delivery_carrier_id`)
- `addons/purchase_requisition_stock`: `purchase.requisition.picking_count` + `stock.picking.requisition_id`
- `addons/purchase_requisition_sale`: `purchase.requisition.sale_order_count` + `sale.order.requisition_id`
- `addons/product_margin`, `addons/product_expiry`: product/lot margin + expiry lifecycle fields
- `addons/auth_password_policy`: `password.policy` + settings fields (`password_min_length`, `password_require_*`)
- `addons/social_media`, `addons/base_address_extended`, `addons/base_geolocalize`

### Config Changes
- `core/tools/config.py`: cluster E modules in `DEFAULT_SERVER_WIDE_MODULES`
- `core/release.py`: bumped to `1.114.0`

---

## Phases 287–288 – HR Bridge Modules (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase287_288 -v`

### New Modules
- `addons/hr_gamification`: `hr.employee.badge_ids` -> `gamification.badge.user`
- `addons/hr_fleet`: `hr.employee.vehicle_ids` + `fleet.vehicle.employee_id`
- `addons/hr_maintenance`: `hr.employee.equipment_ids` + `maintenance.equipment.employee_id`
- `addons/hr_calendar`: `calendar.event.employee_id` + `hr.employee.meeting_count`
- `addons/hr_homeworking`: `hr.employee.location` + `hr.employee.work_location_id`
- `addons/hr_recruitment_skills`: `hr.applicant.skill_ids` (Many2many `hr.skill`)

### Config Changes
- `core/tools/config.py`: added all phase 287-288 modules to `DEFAULT_SERVER_WIDE_MODULES`

---

## Phases 284–286 – Project Bridge Modules (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase284_286 -v`

### New Modules
- `addons/project_todo`: to-do helpers on project tasks + onboarding hook
- `addons/project_stock`: project linkage on stock pickings + project picking counters/actions
- `addons/project_sms`: SMS template bridge on task stages + project/task SMS hooks
- `addons/project_purchase`: purchase orders linked to projects + project purchase counter/action
- `addons/project_hr_expense`: expenses linked to projects + project expense counter/action
- `addons/project_sale_expense`: sale-expense profitability bridge methods
- `addons/project_timesheet_holidays`: leave/global leave links for timesheets + company time-off defaults

### Config Changes
- `core/tools/config.py`: added all phase 284-286 modules to `DEFAULT_SERVER_WIDE_MODULES`

---

## Phases 274–283 – Accounting, Gamification, Supply Chain and MRP Bridges (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase274_283 -v`

### New Modules
- `addons/account_debit_note`: debit note wizard + debit origin links on account moves
- `addons/crm_sms`: CRM/SMS bridge
- `addons/gamification`: badge/challenge/goal/karma models
- `addons/sale_loyalty`: loyalty fields on sale orders
- `addons/gamification_sale_crm`: CRM win -> gamification signal
- `addons/purchase_requisition`: purchase agreements
- `addons/stock_landed_costs`: landed costs models
- `addons/sale_mrp`: sales to manufacturing bridge
- `addons/purchase_mrp`: purchasing to BOM bridge
- `addons/sale_purchase_stock`, `addons/sale_stock_margin`, `addons/sale_timesheet_margin`: composite bridges

### Config Changes
- `core/tools/config.py`: added all phase 274-283 modules
- `core/release.py`: bumped to `1.109.0`

---

## Phases 271–273 – Sale Extensions (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase262 -v`

### New Modules
- `addons/sale_margin`: margin, purchase_price on sale orders
- `addons/sale_sms`: SMS integration with sales
- `addons/sale_expense`: sale_order_id on hr.expense

### Config Changes
- `core/tools/config.py`: added sale_margin, sale_sms, sale_expense

---

## Phases 268–270 – Sale Bridges (2026-03-19)

### Pre-Deployment Steps
- [ ] Run tests: `python3.11 -m unittest tests.test_phase262 -v`
- [ ] Run `./erp-bin db init -d <db_name>` if needed

### New Modules
- `addons/sale_crm`: opportunity_id on sale.order, order_ids on crm.lead
- `addons/sale_purchase`: service_to_purchase, sale_line_id, auto-PO on SO confirm
- `addons/sale_timesheet`: so_line_id on analytic.line, timesheet_ids on sale.order.line

### Config Changes
- `core/tools/config.py`: added sale_crm, sale_purchase, sale_timesheet

---

## Phases 262–267 – Sales Stack, Communication, ORM _read_group (2026-03-19)

### Pre-Deployment Steps
- [ ] Python 3.10+ required
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3.11 -m unittest tests.test_phase262 tests.test_read_group_phase267 -v`

### New Modules
- `addons/utm`: utm.campaign, utm.medium, utm.source, utm.stage, utm.tag, utm.mixin
- `addons/phone_validation`: phone.blacklist, res.partner/res.users _phone_format
- `addons/iap_mail`: iap.account extensions
- `addons/sales_team`: crm.team, crm.team.member, crm.tag
- `addons/link_tracker`: link.tracker, link.tracker.click, link.tracker.code
- `addons/partner_autocomplete`: res.partner autocomplete stubs
- `addons/account_payment`: account.payment, account.move payment_ids, transaction_ids/invoice_ids bridge (portal payment)
- `addons/account_check_printing`: account.payment check_number, account.journal check_sequence_id
- `addons/sale_management`: sale.order.template, sale.order.template.line
- `addons/project_account`: project.project profitability fields
- `addons/sale_service`: sale.order.line project_id, task_id
- `addons/sale_project`: sale.order project_id, project.task sale_line_id
- `addons/sms`: sms.sms, sms.template
- `addons/privacy_lookup`: privacy.log
- `addons/web_tour`: web_tour.tour

### Config Changes
- `core/tools/config.py`: added all new modules to DEFAULT_SERVER_WIDE_MODULES
- `addons/sale/__manifest__.py`: added sales_team dependency
- `core/release.py`: version_info = (1, 103, 0)

### Migration Notes
- ORM: _read_group, _read_grouping_sets added; read_group wraps _read_group
- Model merge: when _name == _inherit, attrs are merged (extension inheritance)

---

## Phases 254–261 – ORM Parity, Auth, IAP, Business Modules (2026-03-19)

### Pre-Deployment Steps
- [ ] Python 3.10+ required; run tests with `python3.11 -m unittest tests.test_orm_commands_phase254 tests.test_base_setup_phase255 tests.test_auth_signup_phase256 -v`
- [ ] Run `./erp-bin db init -d <db_name>`

### New Modules
- `addons/base_setup`: res.config.settings
- `addons/auth_signup`: res.partner signup fields, res.users.signup
- `addons/auth_oauth`: auth.oauth.provider
- `addons/iap`: iap.account
- `addons/portal_rating`: rating.rating portal extension
- `addons/lunch`: 9 models (lunch.order, lunch.product, etc.)
- `addons/data_recycle`: data.recycle.model, data.recycle.record

### Config Changes
- `core/tools/config.py`: added base_setup, auth_signup, auth_oauth, iap, portal_rating, lunch, data_recycle
- `core/release.py`: MIN_PY_VERSION = (3, 10)

### Migration Notes
- Python 3.10+ required for platform

---

## Phases 251–253 – Digest, Base Automation, MRP Subcontracting (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3 -m pytest tests/test_digest_phase251.py tests/test_base_automation_phase252.py tests/test_mrp_subcontracting_phase253.py tests/test_automation_phase226.py -v`

### New Modules
- `addons/digest`: digest.digest, digest.tip; res.users digest_ids
- `addons/base_automation`: base.automation (extracted from base)
- `addons/mrp_subcontracting`: extends mrp.bom, stock.move, stock.warehouse, res.partner

### Config Changes
- `core/tools/config.py`: added `digest` (after portal), `base_automation` (after base_import), `mrp_subcontracting` (after mrp_account)

### Migration Notes
- base.automation moved from addons/base to addons/base_automation
- Automated Actions menu under Settings > Technical (base_automation)

---

## Phases 249–250 – Onboarding + HR Work Entries (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3 -m pytest tests/test_onboarding_phase249.py tests/test_hr_work_entry_phase250.py -v`

### New Modules
- `addons/onboarding`: onboarding.onboarding, onboarding.onboarding.step, onboarding.progress, onboarding.progress.step
- `addons/hr_work_entry`: hr.work.entry, hr.work.entry.type; extends hr.employee with work_entry_source

### Config Changes
- `core/tools/config.py`: added `onboarding` (after web), `hr_work_entry` (before hr_holidays)
- `addons/hr_holidays`: depends on `hr_work_entry`

---

## Phase 248 – Standalone Analytic Module (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>` (analytic auto-loads via DEFAULT_SERVER_WIDE_MODULES)
- [ ] Verify analytic tables: `\d analytic_account`, `\d analytic_line`, `\d account_analytic_plan`
- [ ] Run tests: `python3 -m pytest tests/test_analytic_phase248.py tests/test_analytic_phase168.py -v`

### Config Changes
- `core/tools/config.py`: added `analytic` to DEFAULT_SERVER_WIDE_MODULES (before account)

### New Module
- `addons/analytic`: analytic.account, analytic.line, account.analytic.plan

### Migration Notes
- account no longer defines analytic models; depends on analytic
- hr_timesheet, hr_expense, project get analytic via account → analytic chain

---

## Phase 247 – Standalone Product Module (2026-03-18)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>` (product auto-loads via DEFAULT_SERVER_WIDE_MODULES)
- [ ] Verify product tables: `\d product_template`, `\d product_product`, `\d product_category`, etc.
- [ ] Run tests: `python3 -m pytest tests/test_product_phase247.py tests/test_variants_phase188.py -v`

### Config Changes
- `core/tools/config.py`: added `product` to DEFAULT_SERVER_WIDE_MODULES (before sale)

### New Module
- `addons/product`: product.template, product.product, product.category, product.attribute, product.pricelist, product.supplierinfo

### Migration Notes
- sale no longer defines product models; depends on product
- stock, purchase, website, stock_barcode, etc. get product via sale → product

---

## Multi-Agent Workflow Setup (2026-03-18)

### What Was Added
- `.cursor/rules/core-protocol.mdc` — always-active agent protocol (no DB change)
- `.cursor/rules/agents/*.mdc` — 5 agent persona rule files (no DB change)
- `docs/QUICK_START_AGENTS.md` — team onboarding guide (no DB change)

### No Deployment Action Required
These are IDE-level Cursor rules and documentation. No DB migration, no `DEFAULT_SERVER_WIDE_MODULES` change, no `./erp-bin db init` required.

### Developer Action
- Open Cursor and verify `.cursor/rules/agents/` folder is visible in the file tree
- The `core-protocol.mdc` rule fires automatically (`alwaysApply: true`)
- Agent persona rules fire on trigger phrases (see `docs/QUICK_START_AGENTS.md`)

---

## Pre-deployment

- [ ] Follow docs/ai-rules.md for development and deployment decisions
- [ ] Use odoo-parity skill when implementing parity features (see .agents/skills/odoo-parity)
- [ ] Run tests: `python3 run_tests.py`
- [ ] CI (Phase 113): `.github/workflows/ci.yml` runs unit tests on push/PR; E2E on main/master
- [ ] Optional: run e2e tour: `pip install -r requirements-dev.txt && playwright install chromium && python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v`
- [ ] Install passlib: `pip install "passlib[bcrypt]>=1.7"` (bcrypt<4.1 for passlib compatibility)
- [ ] PostgreSQL: If "role does not exist", run with `PGUSER=postgres` (e.g. `PGUSER=postgres ./erp-bin server`)
- [ ] Verify addons path: `./erp-bin module list`
- [ ] Initialize database: `./erp-bin db init -d <dbname>` (re-run when adding modules like crm, ai_assistant)
- [ ] If Postgres error `relation "res_users" does not exist`: DB exists but schema not applied — run `db init` for that DB name, or restart server (auto-inits when `public.res_users` is missing)
- [ ] **pgvector:** Optional; without it, `db init` uses JSONB for embedding columns (no aborted transaction). Install pgvector on the server when you want `<=>` / vector RAG
- [ ] **PWA (Phase 548):** `/web/manifest.webmanifest` is public JSON metadata + `<link rel="manifest">` on the web shell; no service worker — not offline-capable
- [ ] Optional: install module: `./erp-bin module install -d <db> -m <module>`
- [ ] Check config: `./erp-bin help server`

## WebSocket (optional)

- [ ] For real-time updates (avoid 426 Upgrade Required): run with `--gevent-websocket` and `pip install gevent`
- [ ] Without gevent: longpolling is used; WebSocket requests return 426 (expected, non-fatal)

## Configuration

- [ ] Set `--addons-path` to include base, web, and custom addons
- [ ] Use `--debug=assets` for development (individual files); omit for production (bundled)
- [ ] Set `--http-port` (default 8069)
- [ ] Enable `--proxy-mode` only when behind trusted reverse proxy
- [ ] Set `--db-filter` for multi-tenant deployments

## Security

- [ ] Do not run as root
- [ ] Use `--no-database-list` when hosting multiple databases
- [ ] Restrict DB manager access in production

## Scheduler (Phase 24)

- [ ] Run `erp-bin cron -d <db>` periodically (e.g. via system cron every minute)
- [ ] ir_cron table created on db init; add cron records via RPC or data XML

## Menu Navigation (Phase 162, Phase 170)

- [ ] Navbar shows menu items (Home, Contacts, Leads, Sales, Purchase, Inventory, Project, etc.)
- [ ] If menus are empty after code changes, run `erp-bin db upgrade -d <db>` to reload menus, actions, views
- [ ] Phase 170: load_views auto-runs load_default_data when DB menus empty or stale; warning banner shown if menus still empty
- [ ] mrp in DEFAULT_SERVER_WIDE_MODULES for Manufacturing menus

## Phase 186 (HR Payroll)

- [ ] addons/hr_payroll loaded (depends: base, hr)
- [ ] Payroll > Payslips, Payroll > Salary Rules menus
- [ ] hr.payslip compute_sheet() creates lines from hr.salary.rule; state draft -> done
- [ ] tests/test_payroll_phase186.py passes

## Phase 187 (Product Pricelists)

- [ ] product.pricelist, product.pricelist.item models; Pricelists menu
- [ ] sale.order: pricelist_id; _apply_pricelist() updates line price_unit on action_confirm
- [ ] get_product_price(product, qty) returns price from matching item or list_price
- [ ] tests/test_pricelist_phase187.py passes

## Phase 188 (Full Product Variants)

- [ ] product.template._create_variant_ids() generates product.product from attribute_line_ids combinations
- [ ] create/write on template triggers variant sync; no attributes -> 1 variant; attributes -> Cartesian product
- [ ] tests/test_variants_phase188.py passes

## Phase 189 (Inventory Reordering Rules)

- [ ] stock.warehouse.orderpoint model; Inventory > Configuration > Reordering Rules
- [ ] _procure_orderpoint_confirm() creates purchase.order (with partner) or stock.move (replenishment)
- [ ] tests/test_orderpoint_phase189.py passes

## Phase 234-245 (ERP Next Phases Plan)

- [ ] Phase 234: Recordset filtered_domain, grouped, concat, union, toggle_active, export_data; name_create
- [ ] Phase 235: @api.onchange, @api.ondelete, @api.autovacuum; base.autovacuum model, daily cron
- [ ] Phase 236: Reference, Many2oneReference, Json, Properties fields; _prepare_jsonb_vals; tests/test_orm_fields_phase236.py
- [ ] Phase 237: addons/uom (uom.uom, uom.category); product.template uom_id; tests/test_uom_product_phase237.py
- [ ] Phase 238: addons/resource, addons/hr_holidays; tests/test_resource_hr_holidays_phase238.py
- [ ] Phase 239: addons/contacts, portal, rating
- [ ] Phase 240: addons/sale_stock, purchase_stock, stock_account, mrp_account
- [ ] Phase 241: addons/delivery, loyalty
- [ ] Phase 242: addons/repair
- [ ] Phase 243: addons/survey
- [ ] Phase 244: addons/base_import (base.import.mapping)
- [ ] Phase 245: addons/hr_skills (hr.skill, hr.skill.type, hr.resume.line)

## Phase 229-233 (Barcode, Quality, Anomaly, Maintenance, Event)

- [ ] Phase 229: stock_barcode addon, /barcode/scan, /barcode/parse; product.product barcode
- [ ] Phase 230: quality addon (quality.point, quality.check, quality.alert)
- [ ] Phase 231: ai.anomaly model; detect_anomalies, explain_anomaly tools; llm.py schemas
- [ ] Phase 232: maintenance addon (maintenance.equipment, maintenance.request); tests/test_maintenance_phase232.py
- [ ] Phase 233: event addon (event.event, event.registration); tests/test_event_phase233.py

## Phase 218-225 (ERP Phases 218-225)

- [ ] Phase 218: LLM tool schemas synced (all TOOL_REGISTRY tools in _TOOL_SCHEMAS)
- [ ] Phase 219: ORM sudo(), with_context(), with_user(), _order
- [ ] Phase 220: AI lead scoring (score_lead, assign_lead), ai_score on crm.lead
- [ ] Phase 221: sale_subscription module, recurring invoice cron
- [ ] Phase 222: process_document tool, POST /ai/process-document
- [ ] Phase 223: ir.dashboard.layout, Customize Dashboard
- [ ] Phase 224: fleet module (vehicles, contracts, fuel, services)
- [ ] Phase 225: /health returns version, /metrics Prometheus format

## Phase 217 (HR Expansion)

- [ ] hr_attendance: hr.attendance, /hr/attendance/kiosk
- [ ] hr_recruitment: hr.applicant, hr.recruitment.stage, hr.job extension, /jobs/<id>/apply
- [ ] hr_contract: hr.contract (wage, date_start, date_end, state)

## Phase 216 (E-Commerce website_sale)

- [ ] website_sale module: /shop with AI Recommended for you
- [ ] suggest_products tool; /shop/ai-recommendations API
- [ ] website_sale in DEFAULT_SERVER_WIDE_MODULES

## Phase 215 (AI Analytics & Forecasting)

- [ ] analyze_kpi, forecast_metric tools in ai_assistant
- [ ] ai.forecast model for storing forecasts
- [ ] Dashboard AI Insights: anomaly alerts, forecast display

## Phase 214 (AI Autonomous Agents)

- [ ] POST /ai/agent/run (goal, max_iter); GET /ai/agent/status?task_id=
- [ ] ai.agent.task model; create_record, update_record, generate_report, schedule_action tools
- [ ] Chat panel: Agent mode checkbox when LLM enabled; collapsible steps display
- [ ] ReAct loop: plan -> execute tool -> observe -> decide next step

## Phase 213 (Transient Models & Wizards)

- [ ] TransientModel: _transient_ttl_hours; TTL vacuum when create_date exists
- [ ] vacuum_transient_models in cron
- [ ] base.wizard.confirm, account.reconcile.wizard

## Phase 212 (Binary Fields & File Upload)

- [ ] ir.attachment: datas, mimetype, file_size, checksum
- [ ] POST /web/binary/upload (ufile or file)
- [ ] GET /web/content/<model>/<id>/<field>/<filename>
- [ ] Binary/image file widget in form views

## Phase 211 (Search View, Saved Filters & Action Domain)

- [ ] Search view with filters and group_bys from XML; filter chips in list view
- [ ] parseFilterDomain substitutes uid for domains like [('user_id','=',uid)]
- [ ] Action domain and context passed from ir.actions.act_window to frontend
- [ ] Saved filters (localStorage + ir.filters) and filter chips in renderList

## Phase 210 (ORM Computed Fields & Model Inheritance)

- [ ] Non-stored computed fields computed on read (amount_total, price_subtotal, etc.)
- [ ] Stored computed fields (display_name, amount_total on purchase) recomputed on create/write
- [ ] _inherit: deferred merge when base not yet registered; fields/methods merged into base model
- [ ] tests/test_computed_fields.py, tests/test_model_inheritance.py pass

## Phase 209 (E2E Test Coverage & CI Enhancements)

- [ ] tests/e2e/test_crm_lead_tour.py, test_orders_tour.py
- [ ] pytest-cov for coverage; CI uploads coverage-report artifact
- [ ] E2E: python scripts/with_server.py --server "./erp-bin server" --port 8069 -- pytest tests/e2e/ -v

## Phase 208 (REST API v1 & OpenAPI Spec)

- [ ] /api/v1/<model>: GET list/read, POST create, PUT update, DELETE unlink
- [ ] Bearer token auth; domain, fields, limit, offset, order query params
- [ ] /api/v1/openapi.json, /api/v1/docs (Swagger UI)
- [ ] tests/test_rest_api_phase208.py passes

## Phase 207 (Mass Mailing & Email Marketing)

- [ ] addons/mailing: mailing.list, mailing.list.partner, mailing.mailing, mailing.tracking
- [ ] action_send queues mail.mail per subscriber; tracking pixel and link rewriting
- [ ] /mail/track/open/<token>, /mail/track/click/<token>?url=..., /mail/unsubscribe/<token>
- [ ] Marketing > Mailing Lists, Marketing > Mailings
- [ ] tests/test_mailing_phase207.py passes

## Phase 206 (Multi-Step Approval Chains)

- [ ] approval.rule: parent_rule_id for chaining; approval.request: step, next_rule_id, delegate_to_user_id
- [ ] action_approve creates next step when rule has parent_rule_id; action_reject, action_delegate
- [ ] check_approval_rules on write/create when amount crosses min_amount
- [ ] Settings > Approval Rules, Settings > Approval Requests
- [ ] tests/test_approval_phase206.py passes

## Phase 201 (Dashboard & Reporting Enhancements)

- [ ] Default widgets: Sales This Month, Open Invoices, Low Stock, Overdue Tasks
- [ ] KPI drill-down: click KPI → filtered list (orders, invoices, products, tasks)
- [ ] _load_dashboard_widgets adds missing widgets on db init/upgrade
- [ ] tests/test_dashboard_phase201.py passes

## Phase 200 (Multi-Currency Improvements)

- [ ] account.move: amount_residual in invoice currency
- [ ] account.bank.statement: currency_id
- [ ] Bank reconciliation converts statement amount when currency differs
- [ ] tests/test_multi_currency_phase200.py passes

## Phase 199 (Customer Portal - Invoice Payment)

- [ ] Portal invoice detail: Pay Online button when state in (draft, posted)
- [ ] /my/invoices/<id>/pay: provider selection, creates payment.transaction
- [ ] Demo provider: invoice **`paid`** via **Phase 731** sync on **`payment.transaction`** **`create`** (**Phase 732** — no direct **`account.move.write(paid)`**); manual: pending **`/payment/status/<ref>`**, and when tx is **`done`**, status handler runs **`_sync_linked_invoice_payment_state`**
- [ ] tests/test_portal_invoice_pay_phase199.py passes

## Phase 198 (Lot/Serial Number Tracking)

- [ ] stock.lot has expiry_date; stock.move has lot_id
- [ ] Receipt: assign lot_id on move; validate creates quant with lot
- [ ] Delivery: consume from lot (manual) or FIFO when no lot
- [ ] Inventory > Configuration > Lots menu
- [ ] tests/test_lot_serial_phase198.py passes

## Phase 197 (Purchase → Receipt → Vendor Bill)

- [ ] Confirm PO creates picking with purchase_id; bill_status on order
- [ ] Validate picking updates bill_status; Create Bill on picking creates from received qty
- [ ] action_create_bill on order uses received qty when pickings have done moves
- [ ] tests/test_purchase_receipt_bill_phase197.py passes

## Phase 196 (Sale → Delivery → Invoice)

- [ ] Confirm SO creates picking with sale_id; delivery_status on order
- [ ] Validate picking updates delivery_status; Create Invoice on picking creates from delivered qty
- [ ] action_create_invoice on order uses delivered qty when pickings have done moves
- [ ] tests/test_sale_delivery_invoice_phase196.py passes

## Phase 195 (Reconciliation Wizard)

- [ ] Bank statement form: Reconcile button opens wizard; batch reconcile statement lines with journal items
- [ ] account.reconcile.wizard: select statement lines + move lines, action_reconcile links and sets reconciled_id
- [ ] tests/test_reconcile_wizard_phase195.py passes

## Phase 194 (Platform Fixes)

- [ ] bcrypt<4.1 for passlib compatibility; run `pip install "bcrypt>=4.0,<4.1"` if you see (trapped) bcrypt version error
- [ ] PGUSER=postgres when PostgreSQL role differs from system user
- [ ] WebSocket 426 is expected without --gevent-websocket; longpolling works

## Phase 193 (Bank Statements & Reconciliation)

- [ ] account.bank.statement, account.bank.statement.line models; Invoicing > Bank Statements
- [ ] account.journal type "bank"; default BANK journal and sequence
- [ ] _auto_reconcile matches statement line to account.move.line by amount + partner (asset_cash)
- [ ] POST /web/import/bank_statement: CSV with date, amount, name, partner; creates statement or lines
- [ ] tests/test_bank_statement_phase193.py passes

## Phase 192 (Timesheets)

- [ ] addons/hr_timesheet loaded (depends: base, account, hr, project)
- [ ] analytic.line: employee_id, task_id, project_id; project.task: timesheet_ids
- [ ] Timesheets > My Timesheets (filtered by employee_id.user_id), Timesheets > All Timesheets
- [ ] Task form shows timesheet_ids list
- [ ] tests/test_timesheet_phase192.py passes

## Phase 191 (Payment Terms)

- [ ] account.payment.term, account.payment.term.line models; Invoicing > Configuration > Payment Terms
- [ ] compute(value, date_ref) returns (amount, due_date) installments; balance/percent/fixed
- [ ] account.move: payment_term_id, invoice_date_due (computed); sale.order, purchase.order: payment_term_id
- [ ] Invoice creation from sale order copies payment_term_id; invoice_date_due recomputed after lines
- [ ] tests/test_payment_terms_phase191.py passes

## Phase 190 (Helpdesk Module)

- [ ] addons/helpdesk loaded (depends: base, mail)
- [ ] Helpdesk > Tickets (kanban, list, form); Helpdesk > Configuration > Stages
- [ ] helpdesk.ticket: stage_id, partner_id, user_id, message_ids
- [ ] tests/test_helpdesk_phase190.py passes

## Phase 185 (Bulk Operations)

- [ ] List views: checkbox column with Select All; bulk action bar (Delete Selected, Clear) when rows selected
- [ ] Bulk delete calls rpc unlink on selected IDs; bar hidden when no selection

## Phase 184 (Chatter File Attachments)

- [ ] Chatter: file input, upload to /web/attachment/upload before posting
- [ ] message_post(attachment_ids=[...]) links attachments to message
- [ ] GET /web/attachment/download/<id> serves file

## Phase 183 (PDF Report Templates)

- [ ] Print button on sale.order, account.move, purchase.order, stock.picking opens /report/html/<model>/<id>
- [ ] Templates: Sale Order, Invoice, Purchase Order, Delivery Slip

## Phase 182 (Accounting Reports)

- [ ] Invoicing > Reports > Trial Balance, Profit & Loss, Balance Sheet
- [ ] Date range picker; RPC calls account.account.get_trial_balance, get_profit_loss, get_balance_sheet

## Phase 181 (Tax Management)

- [ ] Invoicing > Configuration > Taxes; account.tax model
- [ ] Sale/Purchase order lines: tax_id, taxes_id; price_subtotal includes tax
- [ ] account.move.line: tax_ids

## Phase 180 (Drag-and-Drop Kanban)

- [ ] Kanban cards draggable; drop on column calls write RPC with group_by field
- [ ] Works for crm.lead (stage_id), project.task (stage_id -> project.task.type)

## Phase 179 (CSV/Excel Import)

- [ ] Import button opens modal; file input accepts .csv and .xlsx
- [ ] POST /web/import/preview returns headers and first 5 rows
- [ ] POST /web/import/execute imports with column mapping; uses Model.import_data

## Phase 178 (Mail Templates)

- [ ] Settings > Email Templates menu; mail.template model with Jinja2 subject/body
- [ ] Server actions: state=email uses template_id to send mail via mail.template.send_mail()

## Phase 176 (Editable List View)

- [ ] List views with editable="bottom" support inline editing (parsed from XML)

## Phase 177 (Search Panel)

- [ ] Search views with &lt;searchpanel&gt; expose hierarchical filters (parsed from XML)

## Phase 173 (Stock Valuation)

- [ ] product.product has standard_price and cost_method (standard/average)
- [ ] stock.valuation.layer created on stock moves; Inventory > Reporting > Valuation

## Phase 172 (Incoming Email to Chatter)

- [ ] Incoming emails with In-Reply-To header matching a sent mail.message are posted to chatter (not new leads)
- [ ] Run `erp-bin db upgrade -d <db>` to add mail.message.message_id column

## Phase 171 (Field Change Tracking)

- [ ] Models with MailThreadMixin (e.g. crm.lead): tracked field changes create mail.message in chatter
- [ ] Use tracking=True on fields that should appear in audit trail (stage_id, partner_id, state, etc.)

## Phase 162 (DB Upgrade)

- [ ] `erp-bin db upgrade -d <db>` runs init_schema + load_default_data idempotently
- [ ] Does NOT drop existing user data (partners, orders, leads, etc.)

## Phase 169 (Responsive Layout + Mobile)

- [ ] @media (max-width: 768px): hamburger menu, stacked nav, full-width forms
- [ ] @media (max-width: 480px): single-column forms, touch targets (min 44px)
- [ ] Kanban single-column on mobile; list horizontal scroll with sticky first column

## Phase 168 (Analytic Accounting)

- [ ] analytic.account, analytic.line models; Invoicing > Configuration > Analytic Accounts
- [ ] hr.expense has analytic_account_id; expense approval creates analytic.line when set
- [ ] project.project has analytic_account_id for cost tracking

## Phase 167 (Calendar Module)

- [ ] calendar in DEFAULT_SERVER_WIDE_MODULES; run `erp-bin db upgrade -d <db>` after adding
- [ ] Calendar > Meetings menu; calendar.event, calendar.attendee models
- [ ] Portal: /my/calendar lists events where user's partner is attendee; /my/calendar/<id> detail
- [ ] My Calendar link in portal nav (when logged in as portal user)

## Post-deployment

- [ ] Verify web client loads at /
- [ ] Verify jsonrpc responds at /jsonrpc (object service requires session)
- [ ] Verify static assets serve from /<module>/static/
- [ ] Verify Contacts list loads (login, click Contacts)
- [ ] Verify Leads list loads (login, click Leads)
- [ ] Verify Project > Projects and Project > Tasks menus load
- [ ] Verify Knowledge > Articles and Knowledge > Categories menus load
- [ ] Verify AI tools: `GET /ai/tools` returns 401 when not authenticated; returns tool list when session present

## AI Module (Phases 9–12)

- [ ] ai_assistant in server_wide_modules (core/tools/config.py)
- [ ] /ai/tools, /ai/chat, /ai/retrieve, /ai/nl_search, /ai/extract_fields routes registered
- [ ] ai.audit.log, ai.document.chunk tables created (db init)
- [ ] Chat panel: AI button in webclient

## Phase 120 (Multi-worker mode)

- [ ] --workers=N starts N HTTP workers + 1 cron worker (prefork)
- [ ] Cron worker runs ir.cron.run_due every 60s
- [ ] SIGTERM triggers graceful shutdown

## Phase 121 (Module scaffold CLI)

- [ ] erp-bin scaffold <name> [dest] creates module with __manifest__.py, models, views, security, controllers

## Phase 125 (Two-Factor Authentication TOTP)

- [ ] addons/auth_totp loaded (core/tools/config.py DEFAULT_SERVER_WIDE_MODULES)
- [ ] pip install pyotp qrcode (or requirements.txt)
- [ ] Settings > Two-Factor Authentication: enable TOTP, scan QR code, confirm code
- [ ] Login flow: when TOTP enabled, password login redirects to /web/login/totp for 6-digit code
- [ ] Routes: /web/totp/status, /web/totp/begin_setup, /web/totp/confirm_setup, /web/totp/disable

## Phase 124 (AI Conversation Memory)

- [x] ai.conversation model stores user_id, messages JSON, model_context, active_id
- [x] /ai/chat accepts conversation_id; loads prior messages; returns conversation_id
- [x] Chat panel: "New" button clears conversation; sends model_context/active_id from current view
- [x] window.chatContext set by main.js when viewing form/list

## Phase 123 (AI-Assisted Data Entry)

- [ ] POST /ai/extract_fields (model, text) returns {fields}; auth required
- [ ] AI Fill button on new lead/partner forms; paste text to extract name, email, phone, description
- [ ] When LLM enabled: OpenAI extracts structured fields; fallback: regex for email/phone

## Phase 122 (AI Natural Language Search)

- [ ] POST /ai/nl_search (model, query, limit) returns {domain, results}; auth required
- [ ] AI Search button in list views (Contacts, Leads, etc.); converts NL query to domain via LLM or ilike fallback
- [ ] When LLM enabled: OpenAI converts query to Odoo domain; fallback: ilike on name/email/description

## Phase 118 (Accounting foundation)

- [ ] addons/account loaded (depends: base, sale)
- [ ] Default chart of accounts and journals (SALE, PURCH, MISC) seeded on db init via _load_account_data
- [ ] sale.order.action_create_invoice creates account.move (customer invoice) with journal entries
- [ ] Invoicing > Invoices, Invoicing > Configuration menus

## Phase 117 (Purchase module)

- [ ] addons/purchase loaded (depends: base, stock)
- [ ] purchase.order.button_confirm creates stock.picking (incoming receipt) with stock.move lines
- [ ] res.partner gains supplier_rank field
- [ ] Purchase > Orders, Purchase > Products menus

## Phase 116 (Inventory/Stock module)

- [ ] addons/stock loaded (depends: base, sale)
- [ ] sale.order.action_confirm creates stock.picking (delivery order) with stock.move lines
- [ ] Default locations (Stock, Output, Vendors, Customers), warehouse, picking types seeded on db init
- [ ] Inventory > Operations > Transfers, Configuration > Warehouses menus

## Phase 227 (Point of Sale)

- [ ] pos.config with journal_id, pricelist_id, warehouse_id
- [ ] pos.session: open (starting cash), opened, closed
- [ ] pos.order: lines, action_pay, action_done (stock moves + accounting)
- [ ] Point of Sale menu: Configuration, Sessions, Orders
- [ ] tests/test_pos_phase227.py passes

## Phase 226 (Workflow Automation Engine)

- [ ] base.automation on_create, on_write, on_unlink, on_time triggers work
- [ ] action_type: update, webhook, server_action execute correctly
- [ ] tests/test_automation_phase226.py passes (use _test_automation_226 and _test_automation_226_ontime DBs)

## Phase 152 (Server Action Fix + Technical Settings)

- [ ] base.automation on_create triggers server action; records.write() in code executes correctly
- [ ] Settings > Technical > Scheduled Actions (ir.cron list/form)
- [ ] Settings > Technical > Server Actions (ir.actions.server list/form)
- [ ] Settings > Technical > Sequences (ir.sequence list/form)
- [ ] tests/test_server_actions_phase119.py passes

## Phase 157 (Portal Signup + Invoice Portal)

- [ ] /web/signup creates portal users (Phase 98)
- [ ] /my/invoices lists customer invoices for portal user's partner
- [ ] /my/invoices/<id> detail + PDF download
- [ ] Portal record rule: account.move (out_invoice, partner_id)
- [ ] tests/test_portal_signup_phase157.py passes

## Phase 155 (Product Variants)

- [ ] product.template, product.attribute, product.attribute.value, product.template.attribute.line
- [ ] product.product _inherits product.template; attribute_value_ids for variant values
- [ ] Shop product detail shows variant selector when template has attribute lines
- [ ] tests/test_product_variant_phase155.py passes

## Phase 154 (Multi-Currency Conversion)

- [ ] res.currency.convert(amount, from_id, to_id, date) uses res.currency.rate
- [ ] sale.order, purchase.order have currency_id (default from company)
- [ ] purchase.order.amount_total computed from order_line (stored)
- [ ] account.move/account.move.line: currency_id, amount_currency for multi-currency invoices
- [ ] tests/test_currency_phase154.py passes

## Phase 161 (Expense Module)

- [ ] addons/hr_expense loaded (depends: base, hr, account)
- [ ] hr.expense, hr.expense.sheet models; workflow: draft → submit → approve → done
- [ ] action_done creates account.move (expense debit, payable credit)
- [ ] ir.sequence hr.expense.sheet seeded on db init
- [ ] tests/test_hr_expense_phase161.py passes

## Phase 160 (Advanced Form Widgets)

- [ ] priority (stars), progressbar, phone, email, url widgets in form/list
- [ ] crm.lead.priority, project.task.priority/progress, res.partner.mobile/website
- [ ] tests/test_widgets_phase160.py passes

## Phase 159 (Webhooks)

- [ ] ir.webhook model (model_name, trigger, url, secret); ir.webhook.log
- [ ] run_webhooks on create/write/unlink; HMAC-SHA256 in X-Webhook-Signature
- [ ] tests/test_webhook_phase159.py passes

## Phase 158 (Gantt View)

- [ ] Gantt view for project.task (date_start, date_deadline) and mrp.production (date_start, date_finished)
- [ ] loadGanttData, renderGanttView in main.js
- [ ] tests/test_gantt_phase158.py passes

## Phase 153 (MRP Manufacturing)

- [ ] addons/mrp loaded (depends: base, stock, sale)
- [ ] Manufacturing > Orders, Bills of Materials, Work Centers menus
- [ ] mrp.production: create() assigns MO/00001 via ir.sequence
- [ ] action_confirm creates stock moves (raw: internal→production, finished: production→internal)
- [ ] action_done validates moves and updates stock.quant
- [ ] Production location created on db init (_load_mrp_data)
- [ ] tests/test_mrp_phase153.py passes

## Phase 114 (RAG bulk reindex cron)

- [ ] ai.rag.reindex model registered; run() indexes res.partner and crm.lead into ai.document.chunk
- [ ] "RAG bulk reindex" cron seeded on db init when ai_assistant loaded (60 min interval)
- [ ] erp-bin cron -d &lt;db&gt; runs ai.rag.reindex.run (up to 500 records per run)

## Phase 115 (Gevent WebSocket for production)

- [ ] Run with --gevent-websocket for WebSocket support (same port as HTTP)
- [ ] Install gevent: pip install gevent (optional; fallback to Werkzeug + longpolling if not installed)
- [ ] Without --gevent-websocket: Werkzeug dev server returns 426 for /websocket/, client uses longpolling

## Phase 29 (CLI Shell + Module Install)

- [ ] `erp-bin module list` shows base, web, crm, ai_assistant
- [ ] `erp-bin module install -d <db> -m crm` completes without errors
- [ ] `erp-bin shell -d <db>` opens REPL with `env` and `registry`
- [ ] From shell, `env['res.partner'].search_read([])` works

## Phases 105–107 (RPC Stabilization, Dashboard, Portal Verification)

- [ ] Phase 105: Contacts/Leads list/form flows no repeated call_kw 500s; test_rpc_read and test_report pass
- [ ] RPC fix: search_read with fields in args+kwargs no longer returns 500; _merge_args_kwargs deduplicates params
- [ ] CORS: If "access control checks" on call_kw, set `--cors-origin=http://<your-origin>` or ensure same origin (localhost vs 127.0.0.1); OPTIONS preflight now supported
- [ ] Phase 106: Dashboard homepage and Settings > Dashboard Widgets work on fresh init and upgraded DB
- [ ] Phase 107: Portal users see only allowed records; upgrade idempotent for base module

## Phases 79–83 (Settings, ir.filters, Chatter, Calendar, Form UX)

- [ ] Settings page: General (company name), Users link, System Parameters table, API Keys
- [ ] Saved filters: Save/load from ir.filters (DB); localStorage fallback when RPC fails
- [ ] Lead form: Chatter section with messages; Send posts via message_post
- [ ] Leads: List | Kanban | Calendar view switcher; calendar month grid with date_deadline
- [ ] Form: Required field validation before save; "You have unsaved changes" banner; confirm on navigation when dirty

## Phase 84 (Graph view)

- [ ] Leads: List | Kanban | Graph | Calendar view switcher; Graph shows bar/line/pie chart
- [ ] Graph: read_group RPC; Chart.js from CDN; stage_id grouped, expected_revenue summed
- [ ] Chart type switcher: Bar, Line, Pie buttons

## Phase 85 (Search facets + group by)

- [ ] Leads list: Filter buttons (Opportunities, Leads) toggleable; Group by Stage dropdown
- [ ] Facet chips above list when filters/group-by active; removable via ×
- [ ] Grouped list rows: group headers, subtotals for expected_revenue when grouped by Stage

## Phase 86 (Import wizard)

- [ ] Import button in list toolbar (next to Export)
- [ ] CSV upload modal: file picker, preview, column mapping, Import/Cancel
- [ ] import_data RPC creates/updates records; result summary (created/updated/errors)

## Phase 87 (QWeb-style reports)

- [ ] /report/html/crm.lead_summary/<ids> renders Jinja2 template with record data
- [ ] /report/pdf/... converts to PDF (weasyprint) or falls back to HTML
- [ ] Print button on lead form and list opens report in new tab

## Phase 110 (Report & action framework – metadata-driven)

- [ ] ir.actions.report records seeded on db init and upgrade (_load_ir_actions_reports)
- [ ] Report lookup uses ir.actions.report when registry is empty (metadata-driven)
- [ ] /web/load_views returns reports map (model -> report_name) from ir.actions.report
- [ ] Print button uses report name from registry when available

## Phase 113 (Runtime and test harness)

- [ ] CI: unit tests run in GitHub Actions with PostgreSQL service
- [ ] E2E: Playwright tour runs on main/master (login, list, form)
- [ ] Multi-db: session stores db; registry per DB; data isolation (test_multi_db_phase113)

## Phase 112 (Minimal Sales module)

- [ ] addons/sale: sale.order, sale.order.line, product.product
- [ ] Sales menu: Orders, Products; list/form views
- [ ] Orders form: order lines (product, qty, price, subtotal); Confirm/Cancel buttons

## Phase 111 (Portal and collaboration)

- [ ] /my/leads/<id> shows lead detail with messages, activities, attachments
- [ ] Portal user can post message via /my/leads/<id>/message
- [ ] /my/attachment/<id> serves attachment when user has access
- [ ] Record rules: portal users read mail.message, mail.activity, ir.attachment for their leads

## Phase 88 (AI LLM integration)

- [ ] GET /ai/config returns llm_enabled, llm_model (auth required)
- [ ] Settings > AI Configuration: OpenAI API key, Enable LLM toggle, Model selector (gpt-4o-mini, gpt-4o, gpt-4-turbo)
- [ ] ir.config_parameter: ai.openai_api_key, ai.llm_enabled, ai.llm_model
- [ ] When ai.llm_enabled=1: Chat panel shows prompt-only mode (no tool/model dropdown); POST /ai/chat with prompt uses OpenAI function-calling
- [ ] RAG: retrieve_chunks injected into system message before LLM call

## Phase 136 (Vector embeddings for RAG)

- [ ] pip install pgvector (optional; enables semantic search)
- [ ] PostgreSQL: CREATE EXTENSION vector (run on db init)
- [ ] ai.document.chunk.embedding column (vector 1536); index_record_for_rag embeds via OpenAI text-embedding-3-small
- [ ] retrieve_chunks: cosine similarity (<=>) when embeddings exist; ilike fallback otherwise
- [ ] Chat panel: "Thinking..." loading indicator; tool/model row hidden when LLM enabled
- [ ] pip install openai for LLM; OPENAI_API_KEY env or ai.openai_api_key in Settings

## Phases 99–103 (Infrastructure, ORM Depth, Website, Migrations, Views)

- [ ] Phase 99: Dockerfile, docker-compose, /health, security headers, CORS, persistent sessions
- [ ] Phase 100: @api.depends recompute; Many2one ondelete cascade/set null; FK constraints
- [ ] Phase 101: addons/website; /my portal; portal users see only own leads

## Phase 144 (Profiling)

- [ ] Run with --debug=profiling for request timing and ORM query stats
- [ ] Response headers: X-Response-Time-Ms, X-Query-Count, X-Query-Time-Ms

## Phase 145 (Backup/Restore)

- [ ] Set --backup-dir=PATH or ERP_BACKUP_DIR env for cron backups
- [ ] ir.config_parameter db.backup_dir alternative
- [ ] erp-bin db backup -d &lt;db&gt; [-o path]; erp-bin db restore -d &lt;db&gt; -f &lt;file&gt;
- [ ] "Database backup" cron runs daily when base.db.backup loaded

## Phase 143 (Shop E2E, Order Email, My Orders)

- [ ] /shop E2E: pytest tests/e2e/test_shop_tour.py (shop → cart → checkout → confirmation)
- [ ] Order confirmation: sale.order.action_confirm creates mail.mail; cron sends
- [ ] /my/orders: portal users see their orders; /my/orders/<id> order detail
- [ ] Portal nav: My Orders link
- [ ] Demo products: db init seeds Widget A/B/C when no products exist

## Phase 142 (Website shop cart + checkout)

- [ ] /shop/cart: view cart, add via ?add=&lt;product_id&gt;, remove via ?remove=&lt;product_id&gt;
- [ ] Cart stored in erp_cart cookie (base64 JSON); anonymous checkout supported
- [ ] /shop/checkout: address form (name, email, street, city); creates res.partner for guests; creates sale.order with order_line; action_confirm
- [ ] /shop/confirmation: thank-you page; cart cookie cleared on checkout
- [ ] Phase 102: erp-bin db upgrade -d <db> -m <module>; core/upgrade/; ir.module.module
- [ ] Phase 103: Leads form tag_ids many2many_tags chip widget (add/remove tags via dropdown)
- [ ] Phase 104: Html field contenteditable widget; Image field preview/upload; activity view grouping

## Phases 94–98 (i18n, WebSocket, Monetary, Mail Module, Portal)

- [ ] Phase 94: Navbar language selector; /web/translations; .po files in addons/base/i18n, addons/web/i18n
- [ ] Phase 95: WebSocket at /websocket/; bus_service.js uses WS first, longpoll fallback
- [ ] Phase 96: crm.lead expected_revenue is Monetary; currency_id in form; list formats monetary with 2 decimals
- [ ] Phase 97: addons/mail module; mail models moved from base; crm depends on mail; mail in server_wide_modules
- [ ] Phase 98: /web/signup creates portal users; base.group_portal; res.users.partner_id, res.partner.user_id; login page link to signup

## Phase 93 (Dashboard homepage)

- [ ] Home/Dashboard shows KPI cards (Open Leads, Expected Revenue, My Activities)
- [ ] KPI cards link to filtered lists (#leads?domain=... for Open Leads)
- [ ] Dashboard: Upcoming Activities, Quick Actions (New Lead, New Contact), Recent Items
- [ ] Recent Items populated from sessionStorage when viewing lead/contact forms
- [ ] Settings > Dashboard Widgets: list, add, edit, delete ir.dashboard.widget
- [ ] ir.dashboard.widget table created on db init; default widgets from _load_dashboard_widgets

## Phase 28 (View Switcher)

- [ ] Leads: List | Kanban toggle buttons above content
- [ ] #leads?view=kanban persists view; sessionStorage fallback
- [ ] Contacts: List only (no kanban in view_mode)

## Phase 27 (res.company, res.groups)

- [ ] res.company: default "My Company" created on db init
- [ ] res.groups: base.group_user, base.group_public
- [ ] Admin user has company_id and group_ids (base.group_user) after init
- [ ] Access rules with group_id: check_access uses user's groups

## Phases 41–45

- [ ] res.partner: is_company checkbox, type dropdown in form; list shows is_company
- [ ] Leads list: tag_ids column shows comma-separated tag names
- [ ] res.country.state_ids: env["res.country"].read(..., ["state_ids"]) returns state ids
- [ ] Search domain [("name", "like", "X")] works (case-sensitive)
- [ ] Navbar: Settings dropdown with API Keys submenu; menu tree from parent_ref

## Phase 40 (Persistent ir.actions / ir.ui.menu)

- [ ] ir.actions.act_window, ir.ui.menu tables created on db init
- [ ] /web/load_views returns actions and menus from DB when authenticated
- [ ] Navbar menus render from DB; runtime changes to actions/menus reflected on next load

## Phases 69–73 (default_get, name_get, attrs, copy, statusbar)

- [ ] default_get: New form pre-fills from field defaults and action context
- [ ] name_get/name_search: Many2one fields use searchable input with autocomplete
- [ ] Attrs: Fields with invisible/readonly/required conditions toggle on form change
- [ ] Copy: Duplicate button in form; copy creates record with " (copy)" suffix
- [ ] Statusbar: Leads form shows stage_id as clickable pipeline pills; click updates stage

## Phases 74–78 (Form structure, activity mixin, server actions, export, design system)

- [ ] Form structure: Leads form has header (statusbar) + sheet; button_box supported
- [ ] mail.activity: Re-run `./erp-bin db init -d <db>` to create mail_activity table
- [ ] Activity mixin: crm.lead.activity_ids now points to mail.activity; activity_schedule RPC
- [ ] Mark Won button: Leads form header has Mark Won; click sets stage to Won
- [ ] List export: Export button in list toolbar; CSV download with display names
- [ ] CSS design system: --space-*, --card-gap, --color-* tokens; .o-card-gradient available

## Phases 67–68 (One2many editable, multi-level Related)

- [ ] One2many editable: Leads form activity_ids table has Add/Delete; create lead with activities; update lead adds/updates/removes activities
- [ ] Multi-level Related: res.partner.country_code = Related("country_id.code"); search_read returns country_code; test_related_field_multi_level passes
- [ ] Re-run `./erp-bin db init -d <db>` to add country_code column on res.partner

## Phases 61–66 (fields_get, model/view inheritance, constraints, breadcrumbs, prefetch)

- [ ] fields_get: RPC `fields_get` returns field metadata; /web/load_views includes `fields_meta` per model
- [ ] Form labels: field.string from metadata (e.g. "Is a Company" not "is_company")
- [ ] Selection options from metadata: no hardcoded helpers needed for new models
- [ ] Model inheritance: `_inherit = "res.partner"` merges fields/methods; verify with `fields_get`
- [ ] View inheritance: `inherit_id` + xpath extends views; positions: inside/after/before/replace
- [ ] SQL constraints: `_sql_constraints` applied on db init; IntegrityError returns user-friendly message
- [ ] Python constraints: `@api.constrains('field')` runs validation on create/write; raises ValidationError
- [ ] Breadcrumbs: "Contacts / John Doe" trail on form; click list crumb returns to list; record name shown after load
- [ ] Prefetch: search_read returns partner_id_display etc.; list view avoids extra RPC for Many2one names
- [ ] Re-run `./erp-bin db init -d <db>` to apply new SQL constraints

## Phases 56–60 (Pagination, toasts, form layout, related fields, onchange)

- [ ] List views: pager "1-80 of N | Prev | Next"; sortable column headers (click toggles asc/desc)
- [ ] Toast notifications: success/error/warning/info; auto-dismiss 4s; replaces alert()
- [ ] Form layout: group (2-col grid), notebook (tabs), page; res.partner form has Contact group + Address tab
- [ ] Related fields: crm.lead.partner_name from partner_id.name; stored on create/write
- [ ] Onchange: changing country_id clears state_id; server _onchange_country_id; debounced RPC on field change/blur

## Phases 51–55 (Action domain, search view, saved filters, computed fields, binary)

- [ ] List views: action domain applied as default filter; search bar uses search_fields from XML
- [ ] Saved filters: Filters dropdown in list; Save current search to localStorage
- [ ] res.partner.display_name: stored computed field; search_read returns display_name
- [ ] Attachments menu (Settings): ir.attachment list/form; file upload for datas field (base64)

## Phases 46–50 (Search operators, form metadata, ir.rule, ir.ui.view, menu visibility)

- [ ] Search domain [("name", "=like", "Estonia")] exact match; [("id", "child_of", id)] hierarchical
- [ ] Form fields: domain/comodel from view XML; state_id filtered by country_id
- [ ] ir.rule table; record rules read from DB; seeded from security/ir_rule.xml
- [ ] ir.ui.view table; views read from DB; seeded from XML; arch stored as JSON
- [ ] ir.ui.menu.groups_ref; menus with non-empty groups_ref filtered by user groups (backend)

## Phase 33 (ORM read/search_read fix)

- [ ] RPC search_read returns non-empty when data exists (res.country, res.partner, etc.)
- [ ] List/form views populate correctly

## Phase 35 (Many2many + Html)

- [ ] Leads form: tag_ids many2many_tags widget (chip UI for crm.tag; add via dropdown, remove via ×)
- [ ] Leads form: note_html textarea
- [ ] Html fields sanitized on write (script/style stripped)

## Phase 34 (res.partner.country_id + res.country.state)

- [ ] res.country.state: 15 EE states loaded on db init
- [ ] res.partner form: country_id, state_id dropdowns work
- [ ] Contacts form: select country and state

## Phase 32 (res.country, res.currency, res.lang)

- [ ] res.country: search returns EE, US, GB, DE, FI
- [ ] res.currency: EUR, USD, GBP created on db init
- [ ] res.lang: en_US, fi_FI created on db init
- [ ] res.company.currency_id Many2one to res.currency; default company has EUR

## Phase 31 (Wizards / TransientModel)

- [ ] TransientModel: models with _transient=True; auto-vacuum when count > max
- [ ] base.wizard.confirm: create, action_confirm unlinks; override _do_confirm for custom logic
- [ ] base.transient.vacuum.run: cron entrypoint; vacuum created on db init

## Phase 30 (ir.config_parameter + Settings Stub)

- [ ] ir.config_parameter: env['ir.config_parameter'].get_param('key') returns value or default
- [ ] ir.config_parameter: set_param('key', 'value') creates/updates; callable via RPC
- [ ] #settings shows stub page with API Keys link
- [ ] #settings/apikeys still works
- [ ] Navbar: Settings link goes to #settings

## Phase 26 (Base Models)

- [ ] ir.sequence: next_by_code('crm.lead') via RPC returns next number
- [ ] ir.attachment: create/read with res_model, res_id, datas (binary)
- [ ] ir.model: table exists; search_read returns metadata
- [ ] db init creates default crm.lead sequence

## Phase 25 (ORM Field Types)

- [ ] Leads form: Type dropdown (Lead/Opportunity)
- [ ] Leads form: Activities read-only sublist (when activities exist)
- [ ] List views: Selection fields show label (e.g. Lead vs lead)

## External JSON-2 API (Phases 14, 20, 21)

- [ ] Set API_KEY env or --api-key= for bearer token auth (fallback)
- [ ] Per-user API keys: web UI at #settings/apikeys (Generate, Revoke)
- [ ] POST /json/2/<model>/<method> with Authorization: bearer <key>
- [ ] X-Odoo-Database header for multi-db
- [ ] res_users_apikeys table created on db init (base module)
# Frontend Runtime

- Verify `window.__erpFrontendBootstrap` is present in the web shell HTML.
- Verify `/web/static/dist/modern_webclient.js` is deployed and served.
- Keep legacy runtime fallback available only during the phase 1-5 migration window.
- If you rebuild the modular runtime, run `npm run build:web` before release (or `npx esbuild` with the same flags as `package.json` if local `node_modules` lacks `esbuild`).
- **Phase P (1.206.0):** Modular bootstrap acceptance criteria live in `docs/frontend.md`; after login, the modern runtime issues a non-blocking `GET /web/webclient/load_menus` early in boot (see `addons/web/static/src/app/main.js`).

# Account company scoping (Phase 560, 1.206.0)

- After `db init` / schema migrate, `account_move.company_id` and `account_journal.company_id` exist; posting respects `res.company.account_lock_date` per move company when `company_id` is set.
- Optional DB test: `python3 -m unittest tests.test_account_move_company_phase560`.

# Post–1.206 waves (1.207.0 — Phases 561–565)

- **561–562:** After pull, run `npm run build:web` (or `npx esbuild` per `package.json`) so `modern_webclient.js` includes shell chrome + list control panel; verify `document.documentElement` has `data-erp-shell-owner="modern"` when logged in.
- **563:** `python3 -m unittest tests.test_account_tax_multi_include_phase563`.
- **564:** `ir_sequence.company_id` column after migrate; optional `python3 -m unittest tests.test_ir_sequence_company_phase564` (needs two companies in DB).
- **565:** `stock_valuation_layer.remaining_qty` / `remaining_value` columns; layers on done moves still no required `account.move`.

# Post–1.207 (1.208.0 — Phases 566–573)

- **566–567:** Rebuild `modern_webclient.js`; smoke form footer (Save/Cancel) and navbar slot (`data-erp-navbar-contract="566"` on delegated hosts when modern bundle loads).
- **568:** `python3 -m unittest tests.test_account_tax_multi_include_phase563` (mixed-tax case).
- **569:** `python3 -m unittest tests.test_ir_sequence_date_range_phase569`.
- **570–571:** `res.company.stock_valuation_auto_account_move` on fresh `db init` / schema sync; FIFO layer consumption on outgoing; Tier C draft moves only when the company flag is set and `account` + expense/`asset_current` accounts exist.
- **572:** Partial reconcile remains design-only (`docs/account_partial_reconcile_design.md`) until implementation is approved.
- **573:** Prod asset default unchanged (concat + guard); document any esbuild-primary experiment in this checklist before switching templates.

# Phase 1.245 Track D3 — Chart Views Extraction

- Ensure `addons/web/static/src/legacy_main_chart_views.js` is loaded **before** `main.js` in `web.assets_web` bundle.
- After deployment, verify `window.__ERP_CHART_VIEWS` exists and `install()` is callable.
- Confirm graph, pivot, calendar, kanban, gantt, and activity views still render correctly after the extraction.
- Chart.js must still be loaded for graph fallback rendering (no new dependency; existing `Chart.js` CDN/bundle reference unchanged).

# Phase 1.245 Track D2 — Legacy List Views Extraction

- Ensure `legacy_main_list_views.js` is loaded **before** `main.js` in the asset bundle (it sets `window.__ERP_LIST_VIEWS`).
- After pull, verify `main.js` calls `window.__ERP_LIST_VIEWS.install(ctx)` to wire dependencies.
- Chart view dispatches require `window.__ERP_CHART_VIEWS` (from the chart extraction) to be present for graph/pivot/activity/gantt views.
