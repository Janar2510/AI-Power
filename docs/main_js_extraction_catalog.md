# `main.js` extraction catalog (Phase 802)

**Goal:** Move legacy web client logic out of the monolithic `main.js` while keeping `web.assets_web` concat-safe (no top-level ESM `export`).

## Completed extractions

| Chunk | New file(s) | Manifest order | Approx. lines removed from `main.js` |
|-------|-------------|----------------|--------------------------------------|
| Route slug + `actionToRoute` / `menuToRoute` | `legacy_main_route_tables.js` | Before `main.js` | ~165 |
| `getActionForRoute` / `getModelForRoute` | `legacy_main_route_resolve.js` | After route tables | ~100 |
| Parse helpers (`parseActionDomain`, `parseFilterDomain`, `parseCSV`) | `legacy_main_parse_utils.js` | Before `main.js` | ~52 |
| **Modern bundle bridges** | `app/router.js`, `app/home_module.js` | ESM (`app/main.js`) | 0 (additive) |
| Form field helpers + rendering + CRUD (48 fns) | `legacy_main_form_views.js` | Before `main.js` | ~1733 |
| List rendering + record loading + saved filters (15 fns) | `legacy_main_list_views.js` | Before `main.js` | ~319 |
| Graph/pivot/calendar/kanban/gantt/activity (16 fns) | `legacy_main_chart_views.js` | Before `main.js` | ~989 |
| Discuss/home/dashboard/settings/sidebar (24 fns) | `legacy_main_shell_routes.js` | Before `main.js` | ~1172 |

`main.js` is now **1847 lines** (down from 5378) — under the <2000 target. All extracted functions have thin delegates in `main.js` that call the extraction modules. Dependencies are wired via `install(ctx)` at boot time.

## Next candidates (stretch)

| Area | Functions / region | Blocker | Suggested file |
|------|-------------------|---------|----------------|
| Navbar render | `renderNavbar` (~320 lines) | Deeply intertwined with sidebar | Could further slim main.js |
| Import modal | `showImportModal` (~177 lines) | Self-contained | `legacy_main_import.js` |
| Accounting reports | `renderAccountingReport` etc. (~200 lines) | Straightforward | `legacy_main_reports.js` |

## Verification (each extraction)

1. `npm run check:assets-concat`
2. `npm run build:web` (+ `build:web:legacy` if touched)
3. `addons/web/static/tests/test_runner.html` — routing + list/form smoke
4. `python3 -m unittest tests.test_http` (esbuild-primary / SW)

## Related

- [odoo19-webclient-gap-table.md](odoo19-webclient-gap-table.md)
- [frontend.md](frontend.md)
