# Deployment Checklist

## Pre-deployment

- [ ] Follow docs/ai-rules.md for development and deployment decisions
- [ ] Use odoo-parity skill when implementing parity features (see .agents/skills/odoo-parity)
- [ ] Run tests: `python3 run_tests.py`
- [ ] Optional: run e2e tour: `pip install -r requirements-dev.txt && playwright install chromium && python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v`
- [ ] Install passlib: `pip install "passlib[bcrypt]>=1.7"`
- [ ] Verify addons path: `./erp-bin module list`
- [ ] Initialize database: `./erp-bin db init -d <dbname>` (re-run when adding modules like crm, ai_assistant)
- [ ] Optional: install module: `./erp-bin module install -d <db> -m <module>`
- [ ] Check config: `./erp-bin help server`

## Configuration

- [ ] Set `--addons-path` to include base, web, and custom addons
- [ ] Use `--debug=assets` for development (individual files); omit for production (bundled)
- [ ] Set `--http-port` (default 8069)
- [ ] Enable `--proxy-mode` only when behind trusted reverse proxy
- [ ] Set `--db-filter` for multi-tenant deployments

## Security

- [ ] Do not run as root
- [ ] Use `--no-database-list` when hosting multiple databases
- [ ] Restrict DB manager access in production

## Scheduler (Phase 24)

- [ ] Run `erp-bin cron -d <db>` periodically (e.g. via system cron every minute)
- [ ] ir_cron table created on db init; add cron records via RPC or data XML

## Post-deployment

- [ ] Verify web client loads at /
- [ ] Verify jsonrpc responds at /jsonrpc (object service requires session)
- [ ] Verify static assets serve from /<module>/static/
- [ ] Verify Contacts list loads (login, click Contacts)
- [ ] Verify Leads list loads (login, click Leads)
- [ ] Verify AI tools: `GET /ai/tools` returns 401 when not authenticated; returns tool list when session present

## AI Module (Phases 9–12)

- [ ] ai_assistant in server_wide_modules (core/tools/config.py)
- [ ] /ai/tools, /ai/chat, /ai/retrieve routes registered
- [ ] ai.audit.log, ai.document.chunk tables created (db init)
- [ ] Chat panel: AI button in webclient

## Phase 29 (CLI Shell + Module Install)

- [ ] `erp-bin module list` shows base, web, crm, ai_assistant
- [ ] `erp-bin module install -d <db> -m crm` completes without errors
- [ ] `erp-bin shell -d <db>` opens REPL with `env` and `registry`
- [ ] From shell, `env['res.partner'].search_read([])` works

## Phase 28 (View Switcher)

- [ ] Leads: List | Kanban toggle buttons above content
- [ ] #leads?view=kanban persists view; sessionStorage fallback
- [ ] Contacts: List only (no kanban in view_mode)

## Phase 27 (res.company, res.groups)

- [ ] res.company: default "My Company" created on db init
- [ ] res.groups: base.group_user, base.group_public
- [ ] Admin user has company_id and group_ids (base.group_user) after init
- [ ] Access rules with group_id: check_access uses user's groups

## Phases 41–45

- [ ] res.partner: is_company checkbox, type dropdown in form; list shows is_company
- [ ] Leads list: tag_ids column shows comma-separated tag names
- [ ] res.country.state_ids: env["res.country"].read(..., ["state_ids"]) returns state ids
- [ ] Search domain [("name", "like", "X")] works (case-sensitive)
- [ ] Navbar: Settings dropdown with API Keys submenu; menu tree from parent_ref

## Phase 40 (Persistent ir.actions / ir.ui.menu)

- [ ] ir.actions.act_window, ir.ui.menu tables created on db init
- [ ] /web/load_views returns actions and menus from DB when authenticated
- [ ] Navbar menus render from DB; runtime changes to actions/menus reflected on next load

## Phases 51–54 (Action domain, search view, saved filters, computed fields)

- [ ] List views: action domain applied as default filter; search bar uses search_fields from XML
- [ ] Saved filters: Filters dropdown in list; Save current search to localStorage
- [ ] res.partner.display_name: stored computed field; search_read returns display_name

## Phases 46–50 (Search operators, form metadata, ir.rule, ir.ui.view, menu visibility)

- [ ] Search domain [("name", "=like", "Estonia")] exact match; [("id", "child_of", id)] hierarchical
- [ ] Form fields: domain/comodel from view XML; state_id filtered by country_id
- [ ] ir.rule table; record rules read from DB; seeded from security/ir_rule.xml
- [ ] ir.ui.view table; views read from DB; seeded from XML; arch stored as JSON
- [ ] ir.ui.menu.groups_ref; menus with non-empty groups_ref filtered by user groups (backend)

## Phase 33 (ORM read/search_read fix)

- [ ] RPC search_read returns non-empty when data exists (res.country, res.partner, etc.)
- [ ] List/form views populate correctly

## Phase 35 (Many2many + Html)

- [ ] Leads form: tag_ids checkboxes (crm.tag options)
- [ ] Leads form: note_html textarea
- [ ] Html fields sanitized on write (script/style stripped)

## Phase 34 (res.partner.country_id + res.country.state)

- [ ] res.country.state: 15 EE states loaded on db init
- [ ] res.partner form: country_id, state_id dropdowns work
- [ ] Contacts form: select country and state

## Phase 32 (res.country, res.currency, res.lang)

- [ ] res.country: search returns EE, US, GB, DE, FI
- [ ] res.currency: EUR, USD, GBP created on db init
- [ ] res.lang: en_US, fi_FI created on db init
- [ ] res.company.currency_id Many2one to res.currency; default company has EUR

## Phase 31 (Wizards / TransientModel)

- [ ] TransientModel: models with _transient=True; auto-vacuum when count > max
- [ ] base.wizard.confirm: create, action_confirm unlinks; override _do_confirm for custom logic
- [ ] base.transient.vacuum.run: cron entrypoint; vacuum created on db init

## Phase 30 (ir.config_parameter + Settings Stub)

- [ ] ir.config_parameter: env['ir.config_parameter'].get_param('key') returns value or default
- [ ] ir.config_parameter: set_param('key', 'value') creates/updates; callable via RPC
- [ ] #settings shows stub page with API Keys link
- [ ] #settings/apikeys still works
- [ ] Navbar: Settings link goes to #settings

## Phase 26 (Base Models)

- [ ] ir.sequence: next_by_code('crm.lead') via RPC returns next number
- [ ] ir.attachment: create/read with res_model, res_id, datas (binary)
- [ ] ir.model: table exists; search_read returns metadata
- [ ] db init creates default crm.lead sequence

## Phase 25 (ORM Field Types)

- [ ] Leads form: Type dropdown (Lead/Opportunity)
- [ ] Leads form: Activities read-only sublist (when activities exist)
- [ ] List views: Selection fields show label (e.g. Lead vs lead)

## External JSON-2 API (Phases 14, 20, 21)

- [ ] Set API_KEY env or --api-key= for bearer token auth (fallback)
- [ ] Per-user API keys: web UI at #settings/apikeys (Generate, Revoke)
- [ ] POST /json/2/<model>/<method> with Authorization: bearer <key>
- [ ] X-Odoo-Database header for multi-db
- [ ] res_users_apikeys table created on db init (base module)
