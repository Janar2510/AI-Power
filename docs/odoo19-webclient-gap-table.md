# Odoo 19 Webclient Gap Table

## Reference vs ERP

| Area | Odoo 19 reference | ERP current state | Migration direction | Status |
|------|-------------------|-------------------|---------------------|--------|
| Bootstrap | `start.js`, `env.js`, `webclient_templates.xml` | `_webclient_html`, static shell, `__erpFrontendBootstrap`, `app/main.js` boot | explicit bootstrap object + bundled app entry | **Met** (foundation): contract + `modern_webclient.js` |
| Services | registry-driven service startup | `env.services` from `createModernServices`; legacy `window.Services` adapters when present | env-owned service startup with legacy adapters | **Met** (foundation): session, views, menu, theme, title, notification |
| Navbar | component + template ownership | string-rendered in legacy runtime; `data-erp-shell-*` markers from modern boot (Phase 561) | shell component ownership | **Partial (566)**: `__erpNavbarContract.markDelegated` sets `data-erp-navbar-contract="566"` on modern slot + legacy `#navbar`; HTML still from `AppCore.Navbar` / `renderNavbar` until full extract |
| Menus | `/web/webclient/load_menus` + menu service | dedicated route + `menu` service prefers endpoint, fallback to `load_views` | dedicated menu endpoint + menu service | **Met** (foundation): route + service + warm load on boot |
| Views | modular view packages + registries | metadata-driven; heavy logic in `main.js` / legacy | migrate dashboard/list/form/kanban into view-owned modules | **Partial (562+567)**: list **control panel** (`AppCore.ListControlPanel`); form **footer actions** (`Save` / `Cancel` / duplicate / print) from `app/form_footer_actions.js` via `AppCore.FormFooterActions` when the modern bundle loads |
| Assets | bundle graph + named assets | concat manifest bundle plus optional esbuild | bundled modern runtime as primary, concat as short-lived fallback | **Met** (dual path): concat+guard + esbuild dist documented; **Phase 573** milestone in `docs/frontend.md` (v1.208.0 — prod default still concat; esbuild-primary not piloted in CI) |

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
