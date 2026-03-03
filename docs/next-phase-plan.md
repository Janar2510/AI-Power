# Next Phase Implementation Plan

Based on [deep-research-report-2.md](../deep-research-report-2.md) and current [parity_matrix.md](parity_matrix.md) status.

---

## Current State Summary

| Layer | Status | Notes |
|-------|--------|-------|
| Foundation (docs, CLI, config) | done | Phases 1–2 complete |
| Core runtime (module loader, ORM, HTTP, security) | done | Phases 3–5 complete |
| Web client kernel | done | Asset bundling, services, data-driven list/form |
| Testing | done | Python + JS unit tests, Playwright e2e, parity verification |
| Upgrades | done | `migrate(cr, version)` contract |
| AI assistant | done | Tool registry, audit log, /ai/tools, /ai/chat |

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

## Phase 7 Complete ✅

All success criteria met. Web client parity kernel and verification baseline established.

## Phase 8: First Business Module ✅

- addons/crm - CRM module with crm.lead (name, stage, expected_revenue, description)
- Views: list, form; menu: Leads
- main.js: generic model routing (contacts, leads)
- server_wide_modules: crm

## Phase 9: AI RAG + Tool Registry ✅

- addons/ai_assistant: ai.audit.log, ai.tool.definition, ai.prompt.template
- addons/ai_assistant/tools/registry.py: search_records, summarise_recordset; execute_tool, log_audit
- /ai/tools (GET) - list tools; /ai/chat (POST) - execute tool under user context
- All tools call ORM under user context; audit log per invocation

---

---

## Phase 10: AI Chat UI ✅

| Task | Implementation | Notes |
|------|----------------|-------|
| Chat panel/sidebar | Collapsible panel in webclient; toggle button in navbar | Minimal UX |
| Chat input + send | Text input, POST to /ai/chat with tool params | Use existing /ai/chat API |
| Message display | Show user prompt + tool result (or error) | Read-only, no streaming yet |
| Tool selection | Optional: dropdown or natural-language → tool mapping | MVP: fixed search_records/summarise |

**Deliverables:** `addons/web/static/src/` chat component; navbar "AI" or chat icon; calls /ai/chat; displays response.

**Scope boundary:** Single-turn only; no RAG retrieval; no streaming.

**Delivered:** Chat panel, tool/model dropdowns, POST /ai/chat, message display.

---

## Phase 11: AI Tools Expansion ✅

| Task | Implementation | Reference |
|------|----------------|-----------|
| draft_message | Generate draft email/message for record | docs/ai.md |
| create_activity | Create activity/task linked to record | docs/ai.md |
| propose_workflow_step | Suggest next stage (e.g. lead → qualified) | docs/ai.md |
| User confirmation | Require confirm for state-changing tools | docs/ai.md, ai-rules |

**Deliverables:** New tools in `addons/ai_assistant/tools/registry.py`; audit log per invocation; confirmation UI for create_activity, propose_workflow_step.

**Delivered:** draft_message, create_activity, propose_workflow_step; crm.activity model.

---

## Phase 12: RAG Retrieval Skeleton ✅

| Task | Implementation | Notes |
|------|----------------|-------|
| Document index | Store document chunks (model, record_id, text) | Minimal schema |
| Retrieval API | Search index by query; return top-k chunks | Record rules before retrieval |
| RAG in /ai/chat | Optional: pass retrieved_doc_ids to tools | Extend log_audit |
| Indexing | Manual or on-write hook for res.partner, crm.lead | Defer full pipeline |

**Deliverables:** `ai.document.chunk` or similar; retrieval endpoint; integrate with /ai/chat flow.

**Scope boundary:** In-memory or simple DB index; defer vector/embedding.

**Delivered:** ai.document.chunk model; retrieve_chunks(); GET /ai/retrieve; optional retrieve in /ai/chat.

---

## Phase 13: List Search + Filters ✅

| Task | Implementation | Notes |
|------|----------------|-------|
| Search bar | Text input above list; domain `[('name','ilike',q)]` | UX parity |
| Domain from URL | Support `?search=foo` or `#contacts?search=foo` | Optional |
| Column filters | Simple filter dropdowns (e.g. stage for leads) | Defer advanced |

**Deliverables:** Search input in list view; pass domain to search_read.

**Delivered:** Search bar, Search button, domain [['name','ilike',q]].

---

## Phase 14: External JSON-2 API ✅

| Task | Implementation | Notes |
|------|----------------|-------|
| Token auth | API key or JWT for external clients | docs/architecture |
| JSON-2 endpoints | Standard Odoo 19 JSON-2 contract | api-contracts when added |
| Multi-db headers | db name from header | Multi-tenant |

**Deliverables:** `core/http/json2.py`; route `/api/v2/...`; token validation.

**Scope boundary:** Defer until internal RPC + AI flow stable.

**Delivered:** core/http/json2.py; POST /json/2/<model>/<method>; bearer token (API_KEY env); X-Odoo-Database header.

---

## Next Phases (15–20) — Odoo 19.0 Parity

Based on [odoo-19.0](../odoo-19.0) reference: `addons/crm`, `addons/rpc`, `odoo/orm`, `odoo/addons/base`.

---

### Phase 15: ORM Many2one + Relational Fields

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| Many2one field | `odoo/fields.py` Many2one | `core/orm/fields.py` Many2one |
| Foreign key in schema | `res_id` + `_model` or single FK column | `partner_id INTEGER REFERENCES res_partner(id)` |
| Browse/read display | `record.partner_id.name` | Resolve FK to related record |
| One2many (reverse) | `fields.One2many` | Defer or minimal (computed from inverse) |

**Deliverables:** Many2one field type; crm.lead.partner_id → res.partner; crm.lead.stage_id → crm.stage; form dropdown for Many2one.

**Scope:** Single FK column; no `_model` polymorphic. Defer One2many/Many2many.

---

### Phase 16: CRM Stage Model (crm.stage)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| crm.stage model | `addons/crm/models/crm_stage.py` | `addons/crm/models/crm_stage.py` |
| Stage data | `data/crm_stage_data.xml` | New, Qualified, Proposition, Won |
| crm.lead.stage_id | Many2one to crm.stage | Replace Char `stage` with stage_id |
| Default stage | `default` on stage_id | First stage by sequence |

**Deliverables:** crm.stage (name, sequence, fold, is_won); crm_lead.stage_id FK; data XML; form stage dropdown.

---

### Phase 17: Kanban View (MVP)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| Kanban arch | `addons/crm/views/crm_lead_views.xml` `<kanban>` | Parse kanban from XML |
| Column by field | `default_group_by="stage_id"` | Group records by stage_id |
| Card template | `<templates><t t-name="...">` | Simple card: name, expected_revenue |
| Drag-drop | Odoo OWL components | Defer; static columns first |

**Deliverables:** `core/data/xml_loader.py` parse kanban; `views/kanban_renderer.js`; main.js route `#leads` to kanban when view type=kanban. No drag-drop.

**Scope:** Read-only kanban; column headers from stage names; cards from template.

---

### Phase 18: Record Rules (ir.rule)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| ir.rule model | `odoo/addons/base/models/ir_rule.py` | `addons/base/models/ir_rule.py` |
| Domain filter | `domain_force` applied to search | Inject domain in ORM search |
| Rule evaluation | Per model, per user groups | `check_rule(env, model, domain, uid)` |
| ir.rule CSV/XML | `security/ir_rule.xml` | Load rules into registry |

**Deliverables:** ir.rule (name, model_id, domain_force, groups); apply in `Model.search()` before SQL; default-allow when no rules.

**Scope:** Domain-only rules; no `perm_read`/`perm_write` split (simplified).

---

### Phase 19: RAG Document Indexing

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| Index on write | N/A (custom) | On res.partner/crm.lead write, upsert ai.document.chunk |
| Chunk content | name, email, description, etc. | Concatenate searchable fields |
| Trigger | ORM write/create | Optional: `_index_for_rag()` called from model |

**Deliverables:** `ai_document_chunk` upsert on partner/lead create/write; `retrieve_chunks` returns populated results.

---

### Phase 20: JSON-2 Parity + API Key Model

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| res.users.apikeys | `addons/base/models/res_users_apikeys.py` | User-bound API keys |
| generate/revoke | `/json/2/res.users.apikeys/generate` | Store hashed key, map to user |
| Bearer auth | `auth='bearer'` in route | Validate against apikeys table |
| /doc endpoint | `addons/api_doc` | Defer |

**Deliverables:** res.users.apikeys model; generate/revoke methods; json2 auth from apikeys instead of env API_KEY.

**Scope:** Replace single API_KEY with per-user keys; keep env fallback for dev.

---

## Recommended Execution Order (Phases 15–20)

1. **Phase 15** — Many2one (enables relational forms)
2. **Phase 16** — CRM Stage (cleaner lead pipeline)
3. **Phase 17** — Kanban (visual pipeline view)
4. **Phase 18** — Record Rules (row-level security)
5. **Phase 19** — RAG Indexing (populate chunks)
6. **Phase 20** — API Key Model (production JSON-2 auth)

---

## Execution Order Summary

**Phases 10–14:** 10 (AI Chat) → 11 (Tools) → 13 (Search) → 12 (RAG) → 14 (JSON-2) — all done.

**Phases 15–20:** 15 (Many2one) → 16 (Stage) → 17 (Kanban) → 18 (Rules) → 19 (RAG Index) → 20 (API Keys).

---

## Next Phases (21–24) — Post Odoo 19 Parity

Phases 15–20 complete. Below is the recommended plan for the next implementation cycle.

---

### Phase 21: User Menu + API Key Management UI

| Task | Implementation | Notes |
|------|----------------|-------|
| User menu in navbar | Dropdown or link group: user name, Logout, API Keys | Navbar currently overwritten by main.js; add user section |
| Logout link | Ensure `/web/logout` visible when navbar re-renders | renderNavbar replaces full navbar; add Logout to nav output |
| API Keys settings view | Route `#settings/apikeys` or modal from user menu | List keys (name, created); Generate; Revoke |
| res.users.apikeys revoke | `revoke(env, ids)` method on model | Delete records by id; restrict to own keys |
| RPC for generate/revoke | call_kw `res.users.apikeys` generate, unlink | Generate returns raw key (show once, copy); unlink for revoke |

**Deliverables:** User menu (logout + API Keys); API Keys management UI; revoke method; RPC integration.

**Scope:** Own-key management only (user_id = env.uid). No admin management of other users' keys in MVP.

**Delivered (1.15.0):** Navbar user menu with API Keys, Logout; #settings/apikeys route; list/generate/revoke UI; ir_rule for res.users.apikeys.

---

### Phase 22: Kanban Drag-Drop (Stage Change)

| Task | Implementation | Notes |
|------|----------------|-------|
| Drag handlers | HTML5 drag-and-drop on kanban cards | `draggable`, `ondragstart`, `ondragover`, `ondrop` |
| Drop target | Column = stage; drop updates `stage_id` | call_kw write on drop |
| Visual feedback | Drop placeholder, column highlight | UX polish |
| Access control | Write permission on crm.lead | Already enforced by RPC |

**Deliverables:** Draggable cards; drop updates stage_id via write; basic visual feedback.

**Scope:** Leads kanban only. Defer calendar, graph, pivot.

**Delivered (1.16.0):** HTML5 drag-drop; onStageChange callback; kanban-dragging, kanban-drag-over CSS.

---

### Phase 23: List Column Filters

| Task | Implementation | Notes |
|------|----------------|-------|
| Stage filter (leads) | Dropdown above list: All, New, Qualified, Won, Lost | domain `[('stage_id','=',id)]` or `in` |
| Filter UI component | Reusable for other models (e.g. partner type) | Simple `<select>` or filter chips |
| URL/state | Optional: `?stage=1` in hash | Persist filter in session or URL |

**Deliverables:** Stage filter dropdown for leads list; domain from filter; optional URL sync.

**Scope:** One filter per model (stage for leads). Defer multi-filter, saved filters.

**Delivered (1.16.0):** Stage filter in leads list and kanban; domain [['stage_id','=',id]]; currentListState.stageFilter.

---

### Phase 24: Scheduler / Cron (Backend)

| Task | Implementation | Notes |
|------|----------------|-------|
| ir.cron model | `addons/base` or `addons/scheduler`: name, model, method, interval | Store cron definitions |
| Cron runner | CLI `erp-bin cron` or background thread | Run due crons; `call_kw(model, method, [], {})` |
| Default crons | Optional: garbage collect sessions, RAG reindex | Defer complex scheduling |

**Deliverables:** ir.cron model; cron runner command or worker; run model methods on schedule.

**Scope:** Interval-based (minutes). Defer cron expressions, timezone handling.

**Delivered (1.17.0):** ir.cron model; erp-bin cron; run_due(env); search <= operator.

---

## Recommended Execution Order (Phases 21–24)

1. **Phase 21** — User menu + API Keys UI (completes Phase 20; enables self-service keys)
2. **Phase 22** — Kanban drag-drop (high UX impact for leads)
3. **Phase 23** — List filters (quick win for leads)
4. **Phase 24** — Scheduler (enables background jobs; lower priority)

---

---

## Next Phases (25–32) — Odoo 19.0 Clone Roadmap

Based on [odoo-19.0](../odoo-19.0) reference: `odoo/addons/base`, `odoo/orm`, `addons/web`, `addons/rpc`.

### Phase 25: ORM Field Types (Selection, One2many, Many2many)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| Selection field | `odoo/orm/fields_selection.py` | `core/orm/fields.py` Selection |
| One2many | `odoo/orm/fields_relational.py` | Inverse of Many2one; virtual, no DB column |
| Many2many | `odoo/orm/fields_relational.py` | Relation table + link model |
| Html field | `odoo/orm/fields_textual.py` | Text with `column_type='text'`; sanitize on write |

**Deliverables:** Selection, One2many (read-only MVP), Many2many (relation table); Html as Text.

**Scope:** One2many: display only, no create from form. Many2many: relation table `model1_id, model2_id`.

---

### Phase 26: Base Models (ir.model, ir.sequence, ir.attachment)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| ir.model | `base/models/ir_model.py` | Model metadata: name, model, info; optional |
| ir.sequence | `base/models/ir_sequence.py` | PostgreSQL sequence; `next_by_code()` |
| ir.attachment | `base/models/ir_attachment.py` | res_model, res_id, datas (binary), name |

**Deliverables:** ir.sequence for auto-numbering (e.g. lead ref); ir.attachment for file storage; ir.model stub.

**Scope:** ir.model as read-only metadata from registry. ir.attachment: store in DB (datas as bytea).

---

### Phase 27: res.company, res.groups, Multi-Company Stub

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| res.company | `base/models/res_company.py` | Single company stub: name, currency_id |
| res.groups | `base/models/res_groups.py` | Groups; link to ir.model.access (group_id) |
| res.users groups | Many2many users ↔ groups | user_id, group_id relation |

**Deliverables:** res.company (1 record default); res.groups; check_access uses user groups.

**Scope:** Single-company; group-based access (group_id in ir.model.access already parsed).

---

### Phase 28: View Switcher + List/Kanban/Form Toggle

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| View mode buttons | `addons/web` list/kanban/form icons | Toggle buttons above content |
| Persist view type | sessionStorage or URL | `#leads?view=kanban` |
| view_mode from action | ir.actions.act_window | Already in action def; respect in UI |

**Deliverables:** View switcher (list | kanban | form) for leads; persist choice per route.

---

### Phase 29: CLI Shell + Module Install

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| shell | `odoo/cli/shell.py` | `erp-bin shell -d db` → IPython/REPL with env |
| module install | `odoo/cli/module.py` | `erp-bin module install -d db -m crm` |
| DB module state | ir_module_module | Table: modules installed per DB |

**Deliverables:** `erp-bin shell`; `erp-bin module install/list`; ir.module.module or minimal install tracking.

**Scope:** install = ensure module in server_wide or DB module list; init schema for new models.

---

### Phase 30: ir.config_parameter + Settings Stub

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| ir.config_parameter | `base/models/ir_config_parameter.py` | key, value; get_param/set_param |
| Settings menu | `base/views/res_config_views.xml` | Placeholder #settings route |

**Deliverables:** ir.config_parameter; `env['ir.config_parameter'].get_param('key')`; settings page stub.

---

### Phase 31: Transient Models (Wizards)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| TransientModel | `odoo/orm/models.py` | No table persistence; in-memory or temp table |
| Wizard pattern | base/wizard/*.py | Form that calls method, then unlink |

**Deliverables:** TransientModel base; simple wizard (e.g. confirm dialog) pattern.

**Scope:** MVP: model with `_transient = True`, auto-vacuum old records.

---

### Phase 32: res.country, res.currency, res.lang (Stub)

| Task | Odoo 19.0 Reference | Our Implementation |
|------|--------------------|---------------------|
| res.country | `base/models/res_country.py` | id, name, code; load from data |
| res.currency | `base/models/res_currency.py` | name, symbol, rate |
| res.lang | `base/models/res_lang.py` | code, name; active langs |

**Deliverables:** res.country (minimal); res.currency (for res.company); res.lang stub. Data XML.

**Scope:** Skeleton for localization; defer full i18n.

---

## Recommended Execution Order (Phases 25–32)

1. **Phase 25** — ORM fields (Selection, One2many, Many2many) — enables richer models
2. **Phase 26** — ir.sequence, ir.attachment — common base needs
3. **Phase 27** — res.company, res.groups — access control refinement
4. **Phase 28** — View switcher — UX parity
5. **Phase 29** — Shell + module install — dev/ops
6. **Phase 30** — ir.config_parameter — config storage
7. **Phase 31** — Wizards — workflow pattern
8. **Phase 32** — res.country/currency/lang — localization base

---

## Odoo 19.0 Reference Map (Key Paths)

| Area | Odoo Path | Notes |
|------|-----------|-------|
| ORM fields | `odoo/orm/fields_*.py` | Selection, One2many, Many2many, Html, Binary |
| Base models | `odoo/addons/base/models/` | ir_model, ir_sequence, ir_attachment, ir_config_parameter, ir_cron, ir_rule, ir_actions, ir_ui_view, ir_ui_menu |
| res.* | `odoo/addons/base/models/res_*.py` | res_partner, res_users, res_company, res_country, res_currency, res_lang, res_groups |
| RPC | `addons/rpc` | JSON-RPC, XML-RPC endpoints |
| Web | `addons/web` | OWL, assets, webclient |
| CLI | `odoo/cli/*.py` | server, db, module, shell, scaffold, i18n |

---

## Out of Scope (Deferred)

- Calendar, graph, pivot views
- Full i18n pipeline (`.po` extraction/import)
- Mobile JS layer
- OWL component framework (stick with vanilla JS / incremental)
- Model inheritance (`_inherit`, `_inherits`)
- Accounting, inventory, e-commerce modules

---

## Success Criteria

- [x] Asset bundles load from manifest; `debug=assets` works
- [x] Service container (rpc, session, action) injectable
- [x] List view renders from XML view definition
- [x] Form view renders from XML view definition
- [x] Menu + actions load from module data
- [x] Playwright tour: login → list → create record
- [x] JS unit test with mock server runs
- [x] Parity matrix updated for completed items

---

## Timeline Estimate (from Report)

Report timeline (lines 399–416) suggests:

- Asset bundling + services MVP: ~28d
- View rendering (list+form) MVP: ~42d
- JS unit test harness + mock server: ~21d
- Integration tours + Playwright: ~28d

**Total for next phase:** ~8–12 weeks at steady pace. Can be parallelised (e.g. asset system + service container).
