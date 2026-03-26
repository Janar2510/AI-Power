# Odoo 19 Webclient Gap Table

## Reference vs ERP

| Area | Odoo 19 reference | ERP current state | Migration direction | Status |
|------|-------------------|-------------------|---------------------|--------|
| Bootstrap | `start.js`, `env.js`, `webclient_templates.xml` | `_webclient_html`, static shell, `__erpFrontendBootstrap`, `app/main.js` boot | explicit bootstrap object + bundled app entry | **Met** (foundation): contract + `modern_webclient.js` |
| Services | registry-driven service startup | `env.services` from `createModernServices`; legacy `window.Services` adapters when present | env-owned service startup with legacy adapters | **Met** (foundation): session, views, menu, theme, title, notification |
| Navbar | component + template ownership | `AppCore.NavbarChrome.buildHtml` + `core/navbar.js` render/wire; glass search row (`app-shell.md`); `data-erp-shell-*` / contract **566**; systray **575** | shell HTML owned by modular builder; legacy delegates | **Met (584+)**: stable chrome module + global search host → command palette; systray mount after **`renderDefault`** via **`__erpLegacyRuntime.renderSystrayMount`** |
| Menus | `/web/webclient/load_menus` + menu service | dedicated route + `menu` service prefers endpoint, fallback to `load_views` | dedicated menu endpoint + menu service | **Met** (foundation): route + service + warm load on boot |
| Views | modular view packages + registries | metadata-driven; heavy logic in `main.js` / legacy | migrate dashboard/list/form/kanban into view-owned modules | **Partial (562+…+684)**: **648–652** menu/app picker; **658–659** list **deep links** + **form save → list** call **`dispatchActWindowForListRoute`** → **`ViewManager.openFromActWindow`** / **`syncListRouteFromMain`** before **`loadRecords`**; **668** **Alt+K** (**`shortcutAltK`**); **680** **`listViewSwitch`** on **`setViewAndReload`**; **682** list sync entry on **`ViewManager`**; **669–670** + **681** stack note in **`frontend.md`**. **660** **Website/eCommerce** placeholders + **687** secondary **#products** / **#orders** links. Still **Partial**: full Odoo **`view_service`** parity not claimed. Tests: **`test_main_js_route_consistency_phase631`**, **`test_modern_action_contract_phase636`** |
| Assets | bundle graph + named assets | concat manifest bundle plus optional esbuild | bundled modern runtime as primary, concat as short-lived fallback | **Met** (dual path): **Phase 586** `_webclient_html` serves **per-file JS** when `ERP_WEBCLIENT_ESBUILD_PRIMARY=1` (pilot); default remains concat **`web.assets_web.js`** + additive **`modern_webclient.js`**; CI still builds esbuild bundle |

## Key Rule

Frontend parity work should copy Odoo’s **boundaries**:

- bootstrap
- env
- services
- registries
- shell ownership
- view ownership

It should not copy Odoo implementation code verbatim.

## Foundation vs full parity

- **Foundation (Phase P):** Bootstrap JSON, bundled modern entry, env/registries/services including menu fetch from `/web/webclient/load_menus`, documented acceptance criteria in `docs/frontend.md`.
- **Remaining:** Navbar/shell component ownership and view packages decoupled from legacy `main.js` (see `docs/adr-frontend-runtime-modernization.md`).
