# Odoo 19 Webclient Gap Table

## Reference vs ERP

| Area | Odoo 19 reference | ERP current state | Migration direction | Status |
|------|-------------------|-------------------|---------------------|--------|
| Bootstrap | `start.js`, `env.js`, `webclient_templates.xml` | `_webclient_html`, static shell, `__erpFrontendBootstrap`, `app/main.js` boot | explicit bootstrap object + bundled app entry | **Met** (foundation): contract + `modern_webclient.js` |
| Services | registry-driven service startup | `env.services` from `createModernServices`; legacy `window.Services` adapters when present | env-owned service startup with legacy adapters | **Met** (foundation): session, views, menu, theme, title, notification |
| Navbar | component + template ownership | `AppCore.NavbarChrome.buildHtml` + `core/navbar.js` render/wire; glass search row (`app-shell.md`); `data-erp-shell-*` / contract **566**; systray **575** | shell HTML owned by modular builder; legacy delegates | **Met (584+)**: stable chrome module + global search host → command palette; systray mount after **`renderDefault`** via **`__erpLegacyRuntime.renderSystrayMount`** |
| Menus | `/web/webclient/load_menus` + menu service | dedicated route + `menu` service prefers endpoint, fallback to `load_views` | dedicated menu endpoint + menu service | **Met** (foundation): route + service + warm load on boot |
| Views | modular view packages + registries | metadata-driven; heavy logic in `main.js` / legacy | migrate dashboard/list/form/kanban into view-owned modules | **Partial (562+567+574+575+585+590+597+603)**: list **control panel**; form **footer actions**; **breadcrumbs**; **kanban chrome** + **card body** (`AppCore.KanbanCardChrome`, **603**); **home KPI strip** (`AppCore.DashboardKpiStrip`, **585** static links → **590** RPC-backed counts when wired); **chatter chrome** (`AppCore.ChatterStrip`, **597**); **gantt/activity** legacy chrome tokenized (**604**); chatter/list/discuss modular boundaries (**590**) when `modern_webclient.js` loads |
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
