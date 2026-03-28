# `main.js` extraction catalog (Phase 802)

**Goal:** Move legacy web client logic out of the monolithic `main.js` while keeping `web.assets_web` concat-safe (no top-level ESM `export`).

## Completed extractions

| Chunk | New file(s) | Manifest order | Approx. lines removed from `main.js` |
|-------|-------------|----------------|--------------------------------------|
| Route slug + `actionToRoute` / `menuToRoute` | `legacy_main_route_tables.js` | Before `main.js` | ~165 |
| `getActionForRoute` / `getModelForRoute` | `legacy_main_route_resolve.js` | After route tables | ~100 |
| Parse helpers (`parseActionDomain`, `parseFilterDomain`, `parseCSV`) | `legacy_main_parse_utils.js` | Before `main.js` | ~52 |
| **Modern bundle bridges** | `app/router.js`, `app/home_module.js` | ESM (`app/main.js`) | 0 (additive) |

`main.js` keeps thin wrappers (`DATA_ROUTES_SLUGS`, `actionToRoute`, …) so internal calls stay unchanged.

## Next candidates (for `<2000` line target)

| Area | Functions / region | Blocker | Suggested file |
|------|-------------------|---------|----------------|
| List render | `renderList`, `loadRecords`, search model wiring | Heavy `currentListState` + `ListViewCore` | `legacy_main_list_views.js` + state on `window.__ERP_LIST_STATE` |
| Form render | `renderForm` tree (`renderFieldHtml` … `validateRequiredFields`) | Many mutual references | `legacy_main_form_views.js` (single IIFE + `install(ctx)`) |
| Graph / pivot / calendar / kanban fallbacks | `renderGraph*` … `renderKanban*` | Share `rpc`, `main`, `viewsSvc` | Split per view or one `legacy_main_chart_views.js` |
| Routing | `routeApplyInternal`, `route`, `bootLegacyWebClient` | Calls all renderers | Last migration after renderers move |
| Discuss + home | `renderDiscuss*`, `renderHome`, settings stubs | `viewsSvc`, `actionStack` | `legacy_main_shell_routes.js` |

## Verification (each extraction)

1. `npm run check:assets-concat`
2. `npm run build:web` (+ `build:web:legacy` if touched)
3. `addons/web/static/tests/test_runner.html` — routing + list/form smoke
4. `python3 -m unittest tests.test_http` (esbuild-primary / SW)

## Related

- [odoo19-webclient-gap-table.md](odoo19-webclient-gap-table.md)
- [frontend.md](frontend.md)
