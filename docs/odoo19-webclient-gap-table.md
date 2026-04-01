# Odoo 19 Webclient Gap Table

## Reference vs ERP

| Area | Odoo 19 reference | ERP current state | Migration direction | Status |
|------|-------------------|-------------------|---------------------|--------|
| Bootstrap | `start.js`, `env.js`, `webclient_templates.xml` | `_webclient_html`, static shell, `__erpFrontendBootstrap`, `app/main.js` boot | explicit bootstrap object + bundled app entry | **Met** (foundation): contract + `modern_webclient.js` |
| Services | registry-driven service startup | `env.services` from `createModernServices`; legacy `window.Services` adapters when present | env-owned service startup with legacy adapters | **Met** (foundation): session, views, menu, theme, title, notification |
| Client model layer | `model/relational_model/*` | `addons/web/static/src/model/relational_model.js` + `services.relationalModel` facade | expand caching/reactivity; keep ORM RPC | **Partial (1.246)**: `Record` / `DynamicList` scaffold over `Services.orm` |
| Search layer | `search/search_model`, `with_search`, control panel | `search/search_model.js`, `with_search.js`, `search_bar.js`; `core/search_model.js` shim | share search across list/form/kanban | **Partial (1.250+)**: **`WithSearch(ListController)`**, **`WithSearch(KanbanController)`**, **`WithSearch(FormController)`** (`formMode`, filter/favorite) when OWL path active (`ActionContainer` + CSP allows template compile). Legacy list/kanban/form unchanged under default CSP. |
| View resolver | `views/view.js` + `registry.category("views")` | `views/view.js` + `__ERP_ViewResolver` + default registrations | migrate `main.js` branches to registry | **Partial (1.246)**: resolver + defaults; not all routes migrated |
| Navbar | component + template ownership | `AppCore.NavbarChrome.buildHtml` + `core/navbar.js` render/wire; glass search row (`app-shell.md`); `data-erp-shell-*` / contract **566**; systray **575**; **1.246** legacy HTML in **`legacy_main_chrome_block.js`** | shell HTML owned by modular builder; legacy delegates | **Met (584+)**: stable chrome module + global search host → command palette; systray mount after **`renderDefault`** via **`__erpLegacyRuntime.renderSystrayMount`** |
| Menus | `/web/webclient/load_menus` + menu service | dedicated route + `menu` service prefers endpoint, fallback to `load_views` | dedicated menu endpoint + menu service | **Met** (foundation): route + service + warm load on boot; **689** **`getAppIdForRoute`** falls back to **`res_model`** via **`getModelForRoute`** + **`window.__ERP_getModelForRoute`** so app chrome matches hash for nested menus |
| Route apply | monolithic `routeApply` | `main.js` `routeApplyInternal` | extractable plugins | **Partial (1.250)**: **`route_apply_registry.js`** + **`installRouteApplyRegistryPlugins()`** in `main.js` — discuss, accounting/stock/sales reports, website/eCommerce placeholders, settings slugs run via `registerBeforeDataRoutes` before data-route regex branch |
| Views | modular view packages + registries | metadata-driven; heavy logic in `main.js` / legacy | migrate dashboard/list/form/kanban into view-owned modules | **Partial (562+…+730)**: **648–652** menu/app picker; **658–659** list **deep links** + **form save → list** call **`dispatchActWindowForListRoute`** → **`ViewManager.openFromActWindow`** / **`syncListRouteFromMain`** before **`loadRecords`**; **668** **list** (**`listTableEditLink`**) + **gantt / activity / calendar** (**`o-erp-actwindow-form-link`**, **730**) + **Alt+K** + form **object** **`act_window`** → **`route()`** + **`dispatchListActWindowThenFormHash`** on list/kanban/toolbars; **680** **`listViewSwitch`**; **682** list sync; **669–670** + **681** + **694** + **696** breadcrumbs / **`?stack=`**. **691**/**693**/**695** **`loadViews`** **`fields`** from **`fields_meta`**; **`__ERP_lastLoadViews`** includes **`fieldsKeyCount`** / **`fieldsSampleKeys`**; opt-in **`__ERP_DEBUG_LOAD_VIEWS`**. **660**/**687** Website/eCommerce placeholders. Still **Partial**: full Odoo **`view_service`** depth not claimed (see **Full `view_service` scope** below). Tests: **`test_main_js_route_consistency_phase631`**, **`test_modern_action_contract_phase636`** |
| Assets | bundle graph + named assets | concat manifest bundle plus optional esbuild | bundled modern runtime as primary; **opt-out** concat for legacy hosts | **Met** (dual path): `_webclient_html` + **`/web/sw.js`** default to **per-manifest JS** when esbuild-primary is on by default (**post–1.244**); set **`ERP_WEBCLIENT_ESBUILD_PRIMARY=0`** to force single **`web.assets_web.js`** tag; additive **`modern_webclient.js`** still loaded for modular shell |
| Field widgets | `addons/web/static/src/views/fields/*`, registries | `addons/web/static/src/core/field_registry.js`, `widgets/*`, manifest order before `main.js` | align widget API with Odoo field components over time | **Partial (1.248+)**: OWL **`fieldRegistry`** + **`badge`**, **`statusbar`**, **`priority`**, **`url`**, **`email`**, **`phone`**, **`image`**, **`color_picker`** + list **`format()`** dispatch; **1.250.1:** legacy **`FieldWidgets.render`** also registers **`statusbar`** (same HTML shell as list/form wiring). Full Odoo matrix still open |
| Action manager | `action_service.js`, `action_container` | `core/action_manager.js`, `services/action.js`, `ViewManager` | consolidate on env **`Services.action`** + **`AppCore.ViewManager`** | **Partial (1.248+)**: **`ActionContainer`** mounted on **`#action-manager`**; **`_tryOwlRoute`** gated by **`__ERP_OWL_ACTION_CONTAINER_MOUNTED`**; legacy fallback preserved |
| Command / hotkeys | `hotkey_service`, command palette | `services/hotkey.js`, `services/command_palette.js`; **`initHotkey`** from **`main.js`** boot | wire all shortcuts through services | **Partial (1.250+)**: **`__ERP_WEBCLIENT_SHORTCUT_CONTRACT.modular`** documents **Alt+H** → `#home`, **Mod+K** command palette, **Alt+K** list→kanban (**`shortcutAltK`**); **`hotkey.js`** calls **`preventDefault`** for **Mod+K** / **Mod+Shift+K** so browser UI does not steal the chord. Legacy **Alt+** set remains in **`main.js`** + frozen **`alt`** array in **`webclient_shortcut_contract.js`**. Full Odoo hotkey matrix not claimed |
| Debug / PWA | `debug_menu`, PWA hooks | `services/debug_menu.js`, `services/pwa.js`; **`pwa.register`** from **`main.js`** | parity optional | **Partial** |

## Odoo 19 reference paths (read-only checklist)

Use these when diffing behaviour (no verbatim code):

| ERP surface | Typical Odoo 19 CE paths |
|-------------|-------------------------|
| Asset manifest | `addons/web/__manifest__.py` (`assets` → `web.assets_backend` / `web.assets_web`) |
| Boot | `addons/web/static/src/main.js` / `start.js`, `env.js` (layout varies by minor) |
| Registry | `addons/web/static/src/core/registry.js`, service maps |
| List / Form | `addons/web/static/src/views/list/*`, `views/form/*` |

## Full `view_service` scope (not claimed — post-1.229.0)

Claiming **full** Odoo **`view_service`** parity needs explicit product scope, for example: batch view + fields RPC shape (or equivalent to upstream), lazy per-view-type loading beyond **`/web/load_views`**, view registries owning list/form/kanban/graph/calendar render paths, and progressive removal of monolithic **`main.js`** view branches. Until that milestone is scheduled, ERP stays at **foundation + action alignment** (**691**–**695**, **668**, **730**). **Release 1.250.0:** no additional scoped **`view_service`** depth shipped — milestone unchanged (Phase P5 planning-only).

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
