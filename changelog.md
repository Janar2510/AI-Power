# Changelog

## 1.20.0 (Phases 46–50: Search operators, form metadata, ir.rule, ir.ui.view, menu visibility)

### Phase 46: Search operators (child_of, =like)
- core/orm/models.py: `=like` exact pattern match (no % wrap); `child_of` recursive CTE for hierarchical models; `parent_of` inverse
- addons/base/models/res_partner.py: parent_id (Many2one) for child_of on res.partner
- tests/test_rpc_read.py: test_search_read_with_eqlike_operator, test_search_read_with_child_of_operator

### Phase 47: Form field metadata from XML
- core/data/xml_loader.py: parse domain, domain_dep, comodel on form/list field elements
- addons/base/views/ir_views.xml, addons/crm/views/crm_views.xml: domain, comodel on state_id, country_id, partner_id, stage_id, tag_ids
- addons/web/static/src/main.js: getViewFieldDef, getMany2oneComodel, getMany2oneDomain, getMany2manyInfo read from view metadata; fallback to hardcoded maps

### Phase 49: ir.rule ORM model
- addons/base/models/ir_rule.py: ir.rule (xml_id, name, model, domain_force)
- core/db/init_data.py: _load_ir_rules seeds from security/ir_rule.xml
- core/orm/security.py: get_record_rules reads from DB when ir_rule table exists; fallback to XML
- ir.model.access: access_ir_rule

### Phase 48: ir.ui.view ORM + DB persistence
- addons/base/models/ir_ui_view.py: ir.ui.view (xml_id, name, model, type, arch, priority)
- core/db/init_data.py: _load_ir_ui_views seeds from load_views_registry
- core/data/views_registry.py: load_views_registry_from_db reads views from ir_ui_view when table exists; arch stored as JSON

### Phase 50: Group-based menu visibility
- addons/base/models/ir_ui_menu.py: groups_ref (Char, comma-separated xml_ids)
- core/data/views_registry.py: filter menus by user groups when groups_ref present; empty = visible to all

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

## 1.22.0 (Phase 29: CLI Shell + Module Install)

### Phase 29: CLI shell
- core/cli/shell.py: `erp-bin shell -d <db>` opens interactive REPL
- Shell exports `env` (Environment), `registry`, and `db` for the selected database
- Uses server-wide modules from config; loads model registry via load_module_graph

### Phase 29: Module install/list
- core/cli/module.py: `erp-bin module list|load|install`
- `module list`: shows modules in addons path with version (from manifest)
- `module install -d <db> -m <module>`: resolves dependencies, loads modules, initializes schema

## 1.21.0 (Phase 28: View Switcher)

### Phase 28: View Switcher (list | kanban)
- main.js: View mode buttons above list/kanban content
- getHashViewParam(): parse ?view= from hash
- getAvailableViewModes(route): from action view_mode
- getPreferredViewType(): URL ?view= > sessionStorage > action default
- setViewAndReload(): persist to sessionStorage, update hash
- renderViewSwitcher(): List | Kanban buttons (only when both available)
- Leads: list and kanban; Contacts: list only
- Hash format: #leads?view=kanban or #leads (list)

## 1.20.0 (Phase 27: res.company, res.groups, User Groups)

### Phase 27: res.company
- addons/base/models/res_company.py: res.company (name, currency_id)
- init_data: creates default "My Company" on db init

### Phase 27: res.groups
- addons/base/models/res_groups.py: res.groups (name, full_name)
- init_data: base.group_user, base.group_public
- full_name stores XML ID for access rule matching

### Phase 27: res.users groups
- res.users: company_id (Many2one), group_ids (Many2many to res.groups)
- Many2many write support in ORM (create + write)
- Recordset.write() added
- init_data: assigns admin to base.group_user and default company
- RPC: write dispatched to write_ids to avoid shadowing instance write

### Phase 27: check_access uses user groups
- security.get_user_groups(registry, db, uid) returns set of group full_name
- rpc.py, json2.py: pass user_groups to check_access
- Group-based access: rules with group_id require user in that group

### Bugfix
- ModelBase.write classmethod renamed to write_ids (was shadowing instance write)
- core/cli/db.py: hash_password import for admin creation

## 1.19.0 (Phase 26: Base Models - ir.sequence, ir.attachment, ir.model)

### Phase 26: ir.sequence
- addons/base/models/ir_sequence.py: ir.sequence (code, name, number_next)
- next_by_code(code): atomic increment, returns next number
- core/db/init_data.py: creates crm.lead sequence on db init
- core/orm/fields.py: Binary field (bytea)

### Phase 26: ir.attachment
- addons/base/models/ir_attachment.py: ir.attachment (name, res_model, res_id, datas)
- File attachments linked to records; datas stored as bytea

### Phase 26: ir.model stub
- addons/base/models/ir_model.py: ir.model (name, model, info)
- Table for model metadata; minimal stub for Odoo parity

### Schema
- core/db/schema.py: bytea column type for Binary
- ir_sequence, ir_attachment, ir_model tables created on db init

## 1.19.3 (Phase 32: res.country, res.currency, res.lang)

### Phase 32: res.country
- addons/base/models/res_country.py: name, code (ISO 2-char)
- init_data: _load_res_country() - EE, US, GB, DE, FI

### Phase 32: res.currency
- addons/base/models/res_currency.py: name, symbol, rate
- init_data: _load_res_currency() - EUR, USD, GBP

### Phase 32: res.lang stub
- addons/base/models/res_lang.py: code, name, active
- init_data: _load_res_lang() - en_US, fi_FI

### Phase 32: res.company currency_id
- res.company.currency_id: Integer → Many2one(res.currency)
- init_data: default company linked to EUR

## 1.19.8 (Phases 41–45)

### Phase 41: res.partner is_company, type
- addons/base/models/res_partner.py: is_company (Boolean), type (Selection: contact, address)
- ir_views.xml: is_company, type in form; is_company in list
- main.js: getSelectionOptions for res.partner type; isBooleanField, checkbox for is_company; list display for boolean
- addons/ai_assistant/tools/registry.py: fields_map includes is_company, type for RAG

### Phase 42: Many2many column in list
- addons/crm/views/crm_views.xml: tag_ids in crm_lead_list columns
- main.js: getDisplayNamesForMany2many; m2mCols in renderList; comma-separated tag names in leads list

### Phase 43: res.country.state_ids One2many
- addons/base/models/res_country.py: state_ids = One2many("res.country.state", "country_id")

### Phase 44: Search operator like
- core/orm/models.py: like operator (case-sensitive) in Model.search
- tests/test_rpc_read.py: test_search_read_with_like_operator

### Phase 45: Menu tree structure
- main.js: buildMenuTree; renderNavbar with parent hierarchy, dropdown for menus with children
- addons/base/views/ir_views.xml: menu_settings, menu_settings_apikeys (parent)
- init_data: _load_ir_actions_menus always upserts (adds new menus to existing DB)

## 1.19.7 (Phase 40: Persistent ir.actions / ir.ui.menu)

### Phase 40: ir.actions.act_window + ir.ui.menu (DB-persistent)
- addons/base/models/ir_actions.py: ir.actions.act_window (xml_id, name, res_model, view_mode)
- addons/base/models/ir_ui_menu.py: ir.ui.menu (xml_id, name, action_ref, parent_ref, sequence)
- init_data: _load_ir_actions_menus() seeds actions and menus from XML (only when tables empty)
- core/data/views_registry.py: load_views_registry_from_db(env) reads actions/menus from DB
- core/http/routes.py: /web/load_views uses DB when session exists, falls back to XML on error
- Views remain from XML; actions and menus persisted and editable at runtime

## 1.19.4 (Phase 33: Fix ORM read/search_read bug)

### Phase 33: ORM read bug fix
- Root cause: classmethod `read(cls, ids, fields)` overrode instance `read(self, fields)`; `rec.read(fields)` invoked classmethod with wrong args
- Fix: rename classmethod to `read_ids`; RPC routes `read` to `read_ids`; instance `read` preserved for search_read → browse().read()
- Include implicit `id` in SELECT when requested (id not in stored fields)
- _get_registry: clear addon modules before load so models register with correct registry (test isolation)
- tests/test_rpc_read.py: search_read returns data via _call_kw

## 1.19.5 (Phase 34: res.partner.country_id + res.country.state)

### Phase 34: res.country.state
- addons/base/models/res_country_state.py: name, code, country_id (Many2one)
- init_data: _load_res_country_state() - 15 EE states (Harjumaa, Hiiumaa, etc.)

### Phase 34: res.partner address fields
- res.partner: country Char → country_id Many2one(res.country), state_id Many2one(res.country.state)
- Form view: country_id, state_id dropdowns
- main.js: getMany2oneComodel for country_id, state_id

## 1.19.6 (Phase 35: Many2many + Html completion)

### Phase 35 Track A: Many2many form display
- addons/crm/models/crm_tag.py: crm.tag (name)
- crm.lead.tag_ids: Many2many to crm.tag
- main.js: getMany2manyInfo, form checkboxes for many2many, getFormVals collects selected ids
- init_data: default crm.tag (Hot, Cold, Follow-up, Qualified, Demo)

### Phase 35 Track A: Html field
- crm.lead.note_html: Html field
- Form: note_html rendered as textarea
- ORM: _sanitize_html_vals strips script/style on create and write

## 1.19.2 (Phase 31: Wizards / TransientModel)

### Phase 31: TransientModel
- core/orm/models_transient.py: TransientModel base (_transient=True), _transient_vacuum(), vacuum_transient_models()
- Transient models use real PostgreSQL tables; auto-vacuum when count > _transient_max_count (default 1000)

### Phase 31: Transient vacuum + cron
- addons/base/models/transient_vacuum.py: base.transient.vacuum model, run() for cron
- init_data: creates ir.cron for transient vacuum (hourly)

### Phase 31: base.wizard.confirm
- addons/base/models/wizard_confirm.py: TransientModel wizard with name, message; action_confirm(ids) RPC, _do_confirm() override

### Bugfix
- Recordset.unlink: perform delete directly (classmethod unlink shadows instance method)

## 1.19.1 (Phase 30: ir.config_parameter + Settings Stub)

### Phase 30: ir.config_parameter
- addons/base/models/ir_config_parameter.py: ir.config_parameter (key, value)
- get_param(key, default=None): returns value or default
- set_param(key, value): create or update; RPC access via read/write ops
- addons/base/security/ir.model.access.csv: access_ir_config_parameter

### Phase 30: Settings stub
- Placeholder #settings route: stub page with links (API Keys, more coming soon)
- Navbar: "Settings" link to #settings; API Keys moved under Settings
- main.js: renderSettingsStub(), route for #settings and #settings/apikeys

## 1.18.0 (Phase 25: ORM Field Types - Selection, One2many)

### Phase 25: Selection Field
- addons/crm/models/crm_lead.py: type Selection (lead/opportunity)
- addons/crm/views/crm_views.xml: type in list and form views
- main.js: getSelectionOptions, getSelectionLabel; form dropdown for Selection; list shows label
- getFormVals: handles Selection (default first option when empty)

### Phase 25: One2many (read-only MVP)
- addons/crm/views/crm_views.xml: activity_ids in lead form
- main.js: getOne2manyInfo; form renders read-only subtable for One2many
- After loadRecord, fetches crm.activity by ids and displays Name/Note/Due table
- getFormVals: skips One2many fields

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
