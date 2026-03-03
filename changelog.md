# Changelog

## 1.0.0 (Initial Release)

### Phase 1: Foundation
- docs/odoo_repo_map.md - Odoo 19.0 repository mapping
- docs/parity_matrix.md - Parity tracking matrix
- docs/architecture.md, frontend.md, backend.md, api.md, migrations.md, test_plan.md
- docs/decisions.md - Architecture decision records
- README.md, CONTRIBUTING.md

### Phase 2: CLI + Config
- erp-bin entrypoint
- core/tools/config.py - addons-path, http-port, gevent-port, proxy-mode, db-filter, test-enable
- core/cli/command.py - command registry, help, server, scaffold, module
- core/cli/templates/default/ - module scaffold template

### Phase 3: Module Loader
- core/modules/module.py - manifest parsing, discovery, dependency resolution
- core/modules/loader.py - load_openerp_module, load_module_graph
- core/modules/registry.py - ModuleRegistry

### Phase 4: ORM MVP
- core/orm/models.py - Model, Recordset, ModelBase
- core/orm/fields.py - Char, Text, Integer, Float, Boolean, Date, Datetime
- core/orm/registry.py, environment.py - Registry, Environment
- core/orm/security.py - ir.model.access CSV parsing

### Phase 5: HTTP + jsonrpc
- core/http/application.py - WSGI Application
- core/http/request.py, controller.py - Request, route decorator
- core/http/routes.py - root route
- Static serving: /<module>/static/<path>
- jsonrpc: /jsonrpc

### Phase 6: Web Client
- addons/web - web client module
- addons/web/static/src/ - session.js, main.js, webclient.css
- Root route serves web client shell

### Phase 7: Testing
- tests/test_config.py, test_modules.py, test_orm.py, test_http.py
- run_tests.py - unittest runner

### Phase 8: Upgrades
- core/upgrade/runner.py - run_migrate(cr, version) contract

### Phase 9: AI Assistant
- addons/ai_assistant - scaffold with models (stubbed), controllers (stubbed), security
- docs/ai.md - threat model and verification

## 1.1.0 (Database + Auth)

### Database Integration
- core/sql_db.py - PostgreSQL connection, get_cursor, create_database, db_exists
- core/db/schema.py - create tables from model definitions
- core/cli/db.py - db create, init, list, drop commands
- addons/base/models/res_users.py - User model (login, password, name)
- Config: db_host, db_port, db_user, db_password, db_name (env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)

### ORM Real CRUD
- Model.read(), write(), create(), unlink(), search() use PostgreSQL
- Environment.cr - cursor for DB operations

### Authentication
- /web/login - login form (GET) and authenticate (POST)
- /web/logout - clear session
- core/http/session.py - in-memory session store
- core/http/auth.py - authenticate(), login_response(), login_response_with_html()
- Root (/) redirects to login when not authenticated

### Bugfix: Invalid login or password
- Auth now uses direct SQL for password check (avoids ORM read cursor state issue)

### Bugfix: White screen after login
- Login now returns webclient HTML directly (200) instead of 302 redirect
- Avoids Safari/browser issues where session cookie was not sent on redirect

## 1.2.0 (Session RPC + Contacts)

### Session-aware RPC
- core/http/rpc.py - dispatch_jsonrpc with call_kw / execute_kw
- Object service requires session; dispatches to ORM with uid/db from cookie
- Supports: search, search_read, read, create, write, unlink

### ORM
- ModelBase.search_read(domain, fields, offset, limit, order)
- ModelBase.read(ids, fields) - class-level API
- Recordset.read(fields)

### Contacts
- addons/base/models/res_partner.py - res.partner (name, email, phone, street, city, country)
- Web client: Home + Contacts nav, Contacts list view via RPC search_read

## 1.3.0 (Contact Form + Security + Module Install)

### Contact form
- Add contact button, create form (#contacts/new)
- Edit contact form (#contacts/edit/:id)
- Recordset.write(), Model.write(ids, vals) for RPC

### Password hashing
- passlib[bcrypt] for password storage
- hash_password(), verify_password() - backward compat with plain passwords
- db init creates admin with hashed password

### Module install CLI
- erp-bin module install -d <db> -m <module>
- Resolves dependencies, loads modules, creates tables

## 1.4.0 (Delete + Access Rights)

### Delete contact
- Delete button in Contacts list with confirm
- Recordset.unlink(), Model.unlink(ids) for RPC

### ir.model.access
- addons/base/security/ir.model.access.csv - res.users, res.partner
- build_access_map(), check_access() - RPC enforces before call_kw
- Default-allow when no rules (backward compat)

### Odoo 19.0 RPC compatibility (from odoo-19.0 reference)
- Add /web/dataset/call_kw support with params { model, method, args, kwargs }
- session.js now uses Odoo 19.0 format: POST /web/dataset/call_kw with direct params
- Handle Odoo create: args = [records] where records is list of dicts
- Match /web/dataset/call_kw and /web/dataset/call_kw/<model>.<method>

### Bugfix: Contact create still failing
- session.js: use credentials: 'include' for fetch (ensures cookies sent)
- rpc.py: support params as list [url, params] (Odoo variant)
- main.js: console.error on create failure for debugging
- /web/session/get_session_info endpoint for session verification

### Bugfix: Session cookie not sent with /jsonrpc (contacts not saving)
- Set cookie path='/' explicitly so session is sent with all requests including /jsonrpc
- On "Session expired", redirect to /web/login
- RPC logging when 401 (no session)

### Bugfix: New contact form not saving
- Use form.querySelector('[name="..."]') instead of form.name (avoids conflict with form's native name property)
- Add getFormVals() and showFormError() helpers
- Show "Please enter a name" when Name is empty; show "Saving..." on button during submit
- Fix error display and button re-enable on failure

### Bugfix: 500 'NoneType' has no attribute 'startswith'
- RPC: validate model_name before access check and _call_kw; return 400 if missing
- security.check_access: handle None/empty model_name; return True (allow)
- security.parse_ir_model_access_csv: handle None content
- config._parse_config: skip None/non-string args
- _get_access_map: try/except with fallback to empty map
- application._guess_mimetype: handle None path

## 1.5.0 (AI Rules + Parity Matrix)

### Documentation
- docs/ai-rules.md - Codified AI agent rules from build plan and deep-research-report
- docs/parity_matrix.md - Updated status to reflect actual implementation (done/in_progress)

### Skills
- Installed: webapp-testing (anthropics/skills), verification-before-completion, test-driven-development, requesting-code-review (obra/superpowers), skill-creator (anthropics/skills)
- Created: odoo-parity skill pack at .agents/skills/odoo-parity (module conventions, naming, acceptance criteria)

## 1.6.0 (Phase 6a: Asset System MVP)

### Asset Bundle System
- core/modules/assets.py - Parse manifest `assets`, resolve include/remove/after/prepend directives
- Route /web/assets/<bundle_id>.<css|js> - Serve concatenated bundles
- debug=assets mode: ?debug=assets or --debug=assets for individual file URLs (no minification)
- Web client uses bundle URLs by default; individual files when debug

### Config
- --debug=assets flag for server-wide debug asset mode

### Tests
- tests/test_assets.py - resolve_bundle_assets, get_bundle_content, get_bundle_urls
- test_asset_bundle_css, test_asset_bundle_js in test_http.py

## 1.7.0 (Phase 6b: Service Container + View Pipeline)

### Service Layer
- addons/web/static/src/services/rpc.js - RPC service (callKw)
- addons/web/static/src/services/session.js - Session info (getSessionInfo)
- addons/web/static/src/services/action.js - Action manager (window, client, URL)
- addons/web/static/src/services/i18n.js - Translation stub _(...)
- addons/web/static/src/services/registry.js - Service registry

### View Renderers
- addons/web/static/src/views/list_renderer.js - List view skeleton
- addons/web/static/src/views/form_renderer.js - Form view skeleton
- addons/web/static/src/views/modifier_eval.js - Python-like modifier evaluator

### Refactor
- main.js uses Services.rpc; removed standalone session.js

## 1.8.0 (Phase 6c: Data-Driven Views)

### XML Loader + Views Registry
- core/data/xml_loader.py - Parse ir.ui.view, ir.actions.act_window, menuitem from XML
- core/data/views_registry.py - Aggregate views, actions, menus from module data
- addons/base/views/ir_views.xml - res.partner list/form views, action, menu

### API
- /web/load_views - JSON endpoint (auth required) returns views, actions, menus

### Client
- addons/web/static/src/services/views.js - Views service (load, getView, getAction, getMenus)
- main.js - Columns and form fields from view definitions; loads views on init
- Navbar rendered from menu data (getMenus); action-driven routing (act_window res_model -> hash)

### Bugfix
- views.js: handle 404/500 and non-JSON responses; avoid SyntaxError on r.json() when load_views fails

## 1.9.0 (Phase 7: Testing + Verification)

### Playwright Integration Tour
- tests/e2e/test_login_list_form_tour.py - E2E tour: login → Contacts list → create record
- scripts/with_server.py - Server lifecycle helper for e2e (start server, run command, cleanup)
- playwright.config.py - Base URL, timeouts
- requirements-dev.txt - playwright, pytest, pytest-playwright

### Test Infrastructure
- tests/e2e/conftest.py - E2E fixtures (base_url, login, password, db)
- load_tests in tests/e2e/__init__.py - Exclude e2e from unittest discovery (pytest-based)

### Run E2E
```bash
pip install -r requirements-dev.txt
playwright install chromium
./erp-bin db init -d erp   # if not already done
python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v
```

## 1.10.0 (Phase 7 continued: JS Unit Tests + Mock Server)

### JS Unit Test Harness
- addons/web/static/tests/test_runner.html - Browser test runner
- addons/web/static/tests/test_runner.js - Runs all suites, supports sync/async
- addons/web/static/tests/test_helpers.js - DOM helpers (createContainer, assertEqual, etc.)
- addons/web/static/tests/mock_rpc.js - Mock fetch with deterministic responses (setLoadViewsResponse, setRpcResponse)

### JS Unit Tests
- test_modifier_eval.js - ModifierEval.eval, evalAttr
- test_list_renderer.js - ViewRenderers.list render
- test_views_service.js - Services.views load, getView, getMenus (with mocked fetch)
- test_action_service.js - Services.action doAction (window, url, client)

### Playwright
- tests/e2e/test_js_unit_tests.py - Opens test_runner.html, asserts 0 failures

### Python
- tests/test_http.py - test_js_test_runner_served, test_js_test_mock_rpc_served

## 1.11.0 (Phase 7 completion: Parity Verification)

### Parity Verification Tests
- tests/test_parity_verification.py - Module lifecycle (load order, acyclic, base before dependents), security invariants (ir.model.access parse, build_access_map, check_access default-allow, deny when no match, allow when rule matches)

### HTTP Tests
- test_debug_assets_serves_individual_files - get_bundle_urls returns individual URLs
- test_asset_bundles_load_from_manifest - resolve_bundle_assets from manifest

### Docs
- Success criteria all marked done
- Parity matrix: Web client done, Test harness done, Prefetch deferred

### Bugfix
- addons/web/views/webclient_templates.xml: wrap HTML in CDATA to fix XML parse error (DOCTYPE invalid inside element)

## 1.12.0 (Phase 8 + 9: CRM + AI Assistant)

### Phase 8: CRM Module
- addons/crm: crm.lead (name, partner_id, stage, expected_revenue, description)
- views/crm_views.xml: list, form; action_crm_lead; menu Leads
- security/ir.model.access.csv
- main.js: generic model routing (getModelForRoute, renderList, renderForm for contacts + leads)
- server_wide_modules: crm

### Phase 9: AI RAG + Tool Registry
- addons/ai_assistant: ai.audit.log, ai.tool.definition, ai.prompt.template (implemented)
- addons/ai_assistant/tools/registry.py: search_records, summarise_recordset; execute_tool, log_audit
- /ai/tools (GET): list available tools (auth required)
- /ai/chat (POST): execute tool under user context; logs to ai.audit.log
- server_wide_modules: ai_assistant

### Tests
- test_ai_tools_requires_auth
- test_load_views_registry_has_crm_lead

### Run JS Unit Tests
- Browser: http://localhost:8069/web/static/tests/test_runner.html
- Playwright: pytest tests/e2e/test_js_unit_tests.py -v (with server running)

### Docs
- DeploymentChecklist.md: Leads verification, AI tools verification, db init note for new modules
- docs/ai-implementation-checklist.md: AI deployment and tool-registry verification checklist

## 1.13.0 (Phases 10–14 Implemented)

### Phase 10: AI Chat UI
- addons/web: chat panel (collapsible), tool/model dropdowns, POST /ai/chat
- chat_panel.js: send, display messages, placeholder per tool

### Phase 11: AI Tools Expansion
- addons/ai_assistant/tools/registry.py: draft_message, create_activity, propose_workflow_step
- addons/crm/models/crm_activity.py: crm.activity (name, lead_id, note)
- Chat panel: new tools in dropdown

### Phase 12: RAG Retrieval
- addons/ai_assistant/models/ai_document_chunk.py
- tools/registry.py: retrieve_chunks() with record-rule filtering
- GET /ai/retrieve?q=query&limit=10
- /ai/chat: optional retrieve=true, pass retrieved_doc_ids to audit

### Phase 13: List Search + Filters
- main.js: search bar, Search button, domain [['name','ilike',q]]
- loadRecords(model, route, searchTerm)

### Phase 14: External JSON-2 API
- core/http/json2.py: POST /json/2/<model>/<method>
- Bearer token (API_KEY env or --api-key=)
- X-Odoo-Database header
- search, search_read, read, create, write, unlink

### ORM
- core/orm/models.py: ilike operator in search

### Tests
- test_json2_requires_auth

## 1.17.0 (Phase 24: Scheduler / Cron)

### Phase 24: Scheduler / Cron
- addons/base/models/ir_cron.py: ir.cron (name, model, method, interval_minutes, next_run, active)
- run_due(env): run crons where next_run <= now; update next_run after each run
- core/cli/cron.py: `erp-bin cron [-d db]` runs due jobs
- core/orm/models.py: search supports `<=` operator (for next_run)

## 1.16.0 (Phases 22–23: Kanban Drag-Drop + List Filters)

### Phase 22: Kanban Drag-Drop
- addons/web/static/src/views/kanban_renderer.js: HTML5 drag-and-drop on cards
- Drop on column updates stage_id via write; visual feedback (kanban-dragging, kanban-drag-over)
- main.js: onStageChange callback for leads kanban

### Phase 23: List Column Filters
- Stage filter dropdown for leads (list + kanban views)
- domain [['stage_id','=',id]] when filter selected
- currentListState.stageFilter; Search preserves filter

## 1.15.0 (Phase 21: User Menu + API Key Management UI)

### Phase 21: User Menu + API Keys
- addons/web/static/src/main.js: User menu (API Keys, Logout) in navbar
- addons/web/static/src/scss/webclient.css: nav-user styles
- Route #settings/apikeys: API Keys management (list, generate, revoke)
- addons/base/models/res_users_apikeys.py: revoke(ids), generate(user_id, name) no longer takes env
- addons/base/security/ir_rule.xml: Record rule for res.users.apikeys (user_id = uid)

## 1.14.0 (Phase 20: API Key Model)

### Phase 20: res.users.apikeys
- addons/base/models/res_users_apikeys.py: User-bound API keys (user_id, name, key_hash)
- generate(env, user_id, name): create key, return raw token (show once)
- _check_credentials(env, key): validate bearer token, return user_id or None
- core/http/json2.py: _auth_bearer checks res.users.apikeys first, falls back to API_KEY env
- addons/base/security/ir.model.access.csv: access_res_users_apikeys

### Schema
- res_users_apikeys table created from model (key_hash column for SHA256)

## Planning: Phases 15–20 (Odoo 19.0 Parity)

- docs/next-phase-plan.md: Phases 15–20 added from odoo-19.0 reference
  - Phase 15: ORM Many2one + relational fields
  - Phase 16: CRM Stage model (crm.stage)
  - Phase 17: Kanban view MVP
  - Phase 18: Record rules (ir.rule)
  - Phase 19: RAG document indexing on write
  - Phase 20: JSON-2 + res.users.apikeys ✓

### Planning (1.13.0)
- docs/next-phase-plan.md: Phases 10–14 added
  - Phase 10: AI Chat UI (chat panel in webclient, /ai/chat integration)
  - Phase 11: AI Tools Expansion (draft_message, create_activity, propose_workflow_step)
  - Phase 12: RAG Retrieval Skeleton (document index, retrieval API)
  - Phase 13: List Search + Filters (search bar, domain from input)
  - Phase 14: External JSON-2 API (deferred)
