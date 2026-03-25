# Odoo 19 Webclient Gap Table

## Reference vs ERP

| Area | Odoo 19 reference | ERP current state | Migration direction | Status |
|------|-------------------|-------------------|---------------------|--------|
| Bootstrap | `start.js`, `env.js`, `webclient_templates.xml` | `_webclient_html`, static shell, `__erpFrontendBootstrap`, `app/main.js` boot | explicit bootstrap object + bundled app entry | **Met** (foundation): contract + `modern_webclient.js` |
| Services | registry-driven service startup | `env.services` from `createModernServices`; legacy `window.Services` adapters when present | env-owned service startup with legacy adapters | **Met** (foundation): session, views, menu, theme, title, notification |
| Navbar | component + template ownership | string-rendered in legacy runtime; `data-erp-shell-*` markers from modern boot (Phase 561) | shell component ownership | **Partial (566+575)**: contract **566** on navbar hosts; **575** `__erpNavbarFacade.markSystrayRendered` sets `data-erp-systray-contract="575"` on systray mount after render |
| Menus | `/web/webclient/load_menus` + menu service | dedicated route + `menu` service prefers endpoint, fallback to `load_views` | dedicated menu endpoint + menu service | **Met** (foundation): route + service + warm load on boot |
| Views | modular view packages + registries | metadata-driven; heavy logic in `main.js` / legacy | migrate dashboard/list/form/kanban into view-owned modules | **Partial (562+567+574+575)**: list **control panel**; form **footer actions**; **breadcrumbs** (`AppCore.BreadcrumbStrip`); **kanban chrome** (`AppCore.KanbanControlStrip`) when `modern_webclient.js` loads |
| Assets | bundle graph + named assets | concat manifest bundle plus optional esbuild | bundled modern runtime as primary, concat as short-lived fallback | **Met** (dual path): concat+guard + esbuild dist documented; **Phase 573** prod default concat; **Phase 576** optional pilot env `ERP_WEBCLIENT_ESBUILD_PRIMARY=1` (see `docs/frontend.md`; templates not switched by default) |

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
