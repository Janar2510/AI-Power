# Next Phase Implementation Plan

Based on [deep-research-report-2.md](../deep-research-report-2.md) and current [parity_matrix.md](parity_matrix.md) status.

---

## Current State Summary

| Layer | Status | Notes |
|-------|--------|-------|
| Foundation (docs, CLI, config) | done | Phases 1–2 complete |
| Core runtime (module loader, ORM, HTTP, security) | done | Phases 3–5 complete |
| Web client kernel | in_progress | Basic shell, static serving; no asset bundling, no view pipeline |
| Testing | in_progress | Python unit tests; no JS tests, no integration tours |
| Upgrades | done | `migrate(cr, version)` contract |
| AI assistant | scaffold | Models/controllers stubbed; no RAG, no tool registry |

---

## Next Phase: Web Client Parity Kernel + Verification

**Goal:** Complete Layer B (web client parity kernel) and establish verification baseline before expanding to business modules or AI.

### Phase 6a: Asset System MVP ✅

| Task | Implementation | Reference |
|------|----------------|-----------|
| Asset bundle loader | Parse `assets` from manifest; resolve include/remove/after | Report lines 99–100, 23 |
| Static asset serving | Serve bundled CSS/JS from `/<module>/static/` | Already partial |
| `debug=assets` mode | No minification, sourcemaps when `?debug=assets` | Report line 99 |
| Bundle boundaries | Explicit bundles (e.g. `web.assets_web`); avoid single-bundle regression | Report line 100 |

**Deliverables:** `core/modules/assets.py`; manifest `assets` key honoured; debug mode (`?debug=assets` or `--debug=assets`); route `/web/assets/<bundle>.<css|js>`.

---

### Phase 6b: Service Container + View Pipeline ✅

| Task | Implementation | Reference |
|------|----------------|-----------|
| Service registry | Inject rpc, action, session, i18n into components | Report lines 73–74 |
| View architecture | XML → AST → render pipeline for list/form | Report lines 59–60 |
| Action manager | Treat actions as first-class (window, client, URL) | Report lines 57, 61 |
| Control panel | Search, filters, grouping, context actions | Report line 61 |
| Python-like modifier evaluator | Small expr evaluator in JS for view modifiers | Report line 75 |

**Deliverables:** `addons/web/static/src/services/` (rpc, session, action, i18n, registry); `views/` (list_renderer, form_renderer, modifier_eval); main.js uses Services.rpc.

**Scope boundary:** Skeleton in place; full XML→AST→render in Phase 6c.

---

### Phase 6c: Data-Driven Views ✅

| Task | Implementation | Reference |
|------|----------------|-----------|
| Load view definitions | Parse XML from module `data`; store in registry | Report line 59 |
| Menu/action loading | Load `ir.ui.menu`, `ir.actions.*` from data | Report line 131 |
| View renderer contract | List: columns from view def; Form: fields from view def | Report lines 59–60 |

**Deliverables:** `core/data/xml_loader.py`, `views_registry.py`; `addons/base/views/ir_views.xml`; `/web/load_views` API; `Services.views`; main.js drives list/form from view defs.

---

### Phase 7: Testing + Verification ✅

| Task | Implementation | Reference |
|------|----------------|-----------|
| JS unit test harness | Test runner + DOM helpers | Report lines 96–97 |
| Mock server | Deterministic RPC responses for JS tests | Report lines 96–97 |
| Integration tours | Playwright e2e: login, list view, form create | Report lines 104–106 |
| Parity verification | Module lifecycle, security invariants, ORM prefetch | Report lines 341–358 |

**Deliverables:** `addons/web/static/tests/`; mock RPC (mock_rpc.js); Playwright config + login + list + form tour; test_runner.html + test_*.js.

---

## Recommended Execution Order

1. **Phase 6a** — Asset system (enables proper bundle loading, debug mode)
2. **Phase 6b** — Service container + view pipeline (enables action-first UX)
3. **Phase 6c** — Data-driven views (menus, actions, list/form from XML)
4. **Phase 7** — JS tests + integration tours (validates parity)

---

## Dependencies and Risks

| Dependency | Mitigation |
|------------|------------|
| XML parsing for views | Use Python `xml.etree` or `lxml`; keep schema minimal |
| JS framework choice | Prefer incremental enhancement; avoid large rewrite |
| Playwright setup | Use `webapp-testing` skill; `with_server.py` for lifecycle |

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict “list + form only”; defer kanban, calendar |
| Security drift | Enforce access rights + record rules in any new RPC paths |
| Asset complexity | Start with simple concatenation; add minification later |

---

## Out of Scope (Deferred)

- Kanban, calendar, graph views
- Full i18n pipeline (`.po` extraction/import)
- Mobile JS layer
- Scheduler/Cron (backend)
- External JSON-2 API
- First business domain modules (CRM, accounting)
- AI RAG + tool registry (Phase 9)

---

## Success Criteria

- [ ] Asset bundles load from manifest; `debug=assets` works
- [ ] Service container (rpc, session, action) injectable
- [ ] List view renders from XML view definition
- [ ] Form view renders from XML view definition
- [x] Menu + actions load from module data
- [x] Playwright tour: login → list → create record
- [x] JS unit test with mock server runs
- [ ] Parity matrix updated for completed items

---

## Timeline Estimate (from Report)

Report timeline (lines 399–416) suggests:

- Asset bundling + services MVP: ~28d
- View rendering (list+form) MVP: ~42d
- JS unit test harness + mock server: ~21d
- Integration tours + Playwright: ~28d

**Total for next phase:** ~8–12 weeks at steady pace. Can be parallelised (e.g. asset system + service container).
