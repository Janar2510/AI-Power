# Deployment Checklist

## Phases 262–267 – Sales Stack, Communication, ORM _read_group (2026-03-19)

### Pre-Deployment Steps
- [ ] Python 3.10+ required
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3.11 -m unittest tests.test_phase262 tests.test_read_group_phase267 -v`

### New Modules
- `addons/utm`: utm.campaign, utm.medium, utm.source, utm.stage, utm.tag, utm.mixin
- `addons/phone_validation`: phone.blacklist, res.partner/res.users _phone_format
- `addons/iap_mail`: iap.account extensions
- `addons/sales_team`: crm.team, crm.team.member, crm.tag
- `addons/link_tracker`: link.tracker, link.tracker.click, link.tracker.code
- `addons/partner_autocomplete`: res.partner autocomplete stubs
- `addons/account_payment`: account.payment, account.move payment_ids
- `addons/account_check_printing`: account.payment check_number, account.journal check_sequence_id
- `addons/sale_management`: sale.order.template, sale.order.template.line
- `addons/project_account`: project.project profitability fields
- `addons/sale_service`: sale.order.line project_id, task_id
- `addons/sale_project`: sale.order project_id, project.task sale_line_id
- `addons/sms`: sms.sms, sms.template
- `addons/privacy_lookup`: privacy.log
- `addons/web_tour`: web_tour.tour

### Config Changes
- `core/tools/config.py`: added all new modules to DEFAULT_SERVER_WIDE_MODULES
- `addons/sale/__manifest__.py`: added sales_team dependency
- `core/release.py`: version_info = (1, 103, 0)

### Migration Notes
- ORM: _read_group, _read_grouping_sets added; read_group wraps _read_group
- Model merge: when _name == _inherit, attrs are merged (extension inheritance)

---

## Phases 254–261 – ORM Parity, Auth, IAP, Business Modules (2026-03-19)

### Pre-Deployment Steps
- [ ] Python 3.10+ required; run tests with `python3.11 -m unittest tests.test_orm_commands_phase254 tests.test_base_setup_phase255 tests.test_auth_signup_phase256 -v`
- [ ] Run `./erp-bin db init -d <db_name>`

### New Modules
- `addons/base_setup`: res.config.settings
- `addons/auth_signup`: res.partner signup fields, res.users.signup
- `addons/auth_oauth`: auth.oauth.provider
- `addons/iap`: iap.account
- `addons/portal_rating`: rating.rating portal extension
- `addons/lunch`: 9 models (lunch.order, lunch.product, etc.)
- `addons/data_recycle`: data.recycle.model, data.recycle.record

### Config Changes
- `core/tools/config.py`: added base_setup, auth_signup, auth_oauth, iap, portal_rating, lunch, data_recycle
- `core/release.py`: MIN_PY_VERSION = (3, 10)

### Migration Notes
- Python 3.10+ required for platform

---

## Phases 251–253 – Digest, Base Automation, MRP Subcontracting (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3 -m pytest tests/test_digest_phase251.py tests/test_base_automation_phase252.py tests/test_mrp_subcontracting_phase253.py tests/test_automation_phase226.py -v`

### New Modules
- `addons/digest`: digest.digest, digest.tip; res.users digest_ids
- `addons/base_automation`: base.automation (extracted from base)
- `addons/mrp_subcontracting`: extends mrp.bom, stock.move, stock.warehouse, res.partner

### Config Changes
- `core/tools/config.py`: added `digest` (after portal), `base_automation` (after base_import), `mrp_subcontracting` (after mrp_account)

### Migration Notes
- base.automation moved from addons/base to addons/base_automation
- Automated Actions menu under Settings > Technical (base_automation)

---

## Phases 249–250 – Onboarding + HR Work Entries (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>`
- [ ] Run tests: `python3 -m pytest tests/test_onboarding_phase249.py tests/test_hr_work_entry_phase250.py -v`

### New Modules
- `addons/onboarding`: onboarding.onboarding, onboarding.onboarding.step, onboarding.progress, onboarding.progress.step
- `addons/hr_work_entry`: hr.work.entry, hr.work.entry.type; extends hr.employee with work_entry_source

### Config Changes
- `core/tools/config.py`: added `onboarding` (after web), `hr_work_entry` (before hr_holidays)
- `addons/hr_holidays`: depends on `hr_work_entry`

---

## Phase 248 – Standalone Analytic Module (2026-03-19)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>` (analytic auto-loads via DEFAULT_SERVER_WIDE_MODULES)
- [ ] Verify analytic tables: `\d analytic_account`, `\d analytic_line`, `\d account_analytic_plan`
- [ ] Run tests: `python3 -m pytest tests/test_analytic_phase248.py tests/test_analytic_phase168.py -v`

### Config Changes
- `core/tools/config.py`: added `analytic` to DEFAULT_SERVER_WIDE_MODULES (before account)

### New Module
- `addons/analytic`: analytic.account, analytic.line, account.analytic.plan

### Migration Notes
- account no longer defines analytic models; depends on analytic
- hr_timesheet, hr_expense, project get analytic via account → analytic chain

---

## Phase 247 – Standalone Product Module (2026-03-18)

### Pre-Deployment Steps
- [ ] Run `./erp-bin db init -d <db_name>` (product auto-loads via DEFAULT_SERVER_WIDE_MODULES)
- [ ] Verify product tables: `\d product_template`, `\d product_product`, `\d product_category`, etc.
- [ ] Run tests: `python3 -m pytest tests/test_product_phase247.py tests/test_variants_phase188.py -v`

### Config Changes
- `core/tools/config.py`: added `product` to DEFAULT_SERVER_WIDE_MODULES (before sale)

### New Module
- `addons/product`: product.template, product.product, product.category, product.attribute, product.pricelist, product.supplierinfo

### Migration Notes
- sale no longer defines product models; depends on product
- stock, purchase, website, stock_barcode, etc. get product via sale → product

---

## Multi-Agent Workflow Setup (2026-03-18)

### What Was Added
- `.cursor/rules/core-protocol.mdc` — always-active agent protocol (no DB change)
- `.cursor/rules/agents/*.mdc` — 5 agent persona rule files (no DB change)
- `docs/QUICK_START_AGENTS.md` — team onboarding guide (no DB change)

### No Deployment Action Required
These are IDE-level Cursor rules and documentation. No DB migration, no `DEFAULT_SERVER_WIDE_MODULES` change, no `./erp-bin db init` required.

### Developer Action
- Open Cursor and verify `.cursor/rules/agents/` folder is visible in the file tree
- The `core-protocol.mdc` rule fires automatically (`alwaysApply: true`)
- Agent persona rules fire on trigger phrases (see `docs/QUICK_START_AGENTS.md`)

---

## Pre-deployment

- [ ] Follow docs/ai-rules.md for development and deployment decisions
- [ ] Use odoo-parity skill when implementing parity features (see .agents/skills/odoo-parity)
- [ ] Run tests: `python3 run_tests.py`
- [ ] CI (Phase 113): `.github/workflows/ci.yml` runs unit tests on push/PR; E2E on main/master
- [ ] Optional: run e2e tour: `pip install -r requirements-dev.txt && playwright install chromium && python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v`
- [ ] Install passlib: `pip install "passlib[bcrypt]>=1.7"` (bcrypt<4.1 for passlib compatibility)
- [ ] PostgreSQL: If "role does not exist", run with `PGUSER=postgres` (e.g. `PGUSER=postgres ./erp-bin server`)
- [ ] Verify addons path: `./erp-bin module list`
- [ ] Initialize database: `./erp-bin db init -d <dbname>` (re-run when adding modules like crm, ai_assistant)
- [ ] Optional: install module: `./erp-bin module install -d <db> -m <module>`
- [ ] Check config: `./erp-bin help server`

## WebSocket (optional)

- [ ] For real-time updates (avoid 426 Upgrade Required): run with `--gevent-websocket` and `pip install gevent`
- [ ] Without gevent: longpolling is used; WebSocket requests return 426 (expected, non-fatal)

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

## Menu Navigation (Phase 162, Phase 170)

- [ ] Navbar shows menu items (Home, Contacts, Leads, Sales, Purchase, Inventory, Project, etc.)
- [ ] If menus are empty after code changes, run `erp-bin db upgrade -d <db>` to reload menus, actions, views
- [ ] Phase 170: load_views auto-runs load_default_data when DB menus empty or stale; warning banner shown if menus still empty
- [ ] mrp in DEFAULT_SERVER_WIDE_MODULES for Manufacturing menus

## Phase 186 (HR Payroll)

- [ ] addons/hr_payroll loaded (depends: base, hr)
- [ ] Payroll > Payslips, Payroll > Salary Rules menus
- [ ] hr.payslip compute_sheet() creates lines from hr.salary.rule; state draft -> done
- [ ] tests/test_payroll_phase186.py passes

## Phase 187 (Product Pricelists)

- [ ] product.pricelist, product.pricelist.item models; Pricelists menu
- [ ] sale.order: pricelist_id; _apply_pricelist() updates line price_unit on action_confirm
- [ ] get_product_price(product, qty) returns price from matching item or list_price
- [ ] tests/test_pricelist_phase187.py passes

## Phase 188 (Full Product Variants)

- [ ] product.template._create_variant_ids() generates product.product from attribute_line_ids combinations
- [ ] create/write on template triggers variant sync; no attributes -> 1 variant; attributes -> Cartesian product
- [ ] tests/test_variants_phase188.py passes

## Phase 189 (Inventory Reordering Rules)

- [ ] stock.warehouse.orderpoint model; Inventory > Configuration > Reordering Rules
- [ ] _procure_orderpoint_confirm() creates purchase.order (with partner) or stock.move (replenishment)
- [ ] tests/test_orderpoint_phase189.py passes

## Phase 234-245 (ERP Next Phases Plan)

- [ ] Phase 234: Recordset filtered_domain, grouped, concat, union, toggle_active, export_data; name_create
- [ ] Phase 235: @api.onchange, @api.ondelete, @api.autovacuum; base.autovacuum model, daily cron
- [ ] Phase 236: Reference, Many2oneReference, Json, Properties fields; _prepare_jsonb_vals; tests/test_orm_fields_phase236.py
- [ ] Phase 237: addons/uom (uom.uom, uom.category); product.template uom_id; tests/test_uom_product_phase237.py
- [ ] Phase 238: addons/resource, addons/hr_holidays; tests/test_resource_hr_holidays_phase238.py
- [ ] Phase 239: addons/contacts, portal, rating
- [ ] Phase 240: addons/sale_stock, purchase_stock, stock_account, mrp_account
- [ ] Phase 241: addons/delivery, loyalty
- [ ] Phase 242: addons/repair
- [ ] Phase 243: addons/survey
- [ ] Phase 244: addons/base_import (base.import.mapping)
- [ ] Phase 245: addons/hr_skills (hr.skill, hr.skill.type, hr.resume.line)

## Phase 229-233 (Barcode, Quality, Anomaly, Maintenance, Event)

- [ ] Phase 229: stock_barcode addon, /barcode/scan, /barcode/parse; product.product barcode
- [ ] Phase 230: quality addon (quality.point, quality.check, quality.alert)
- [ ] Phase 231: ai.anomaly model; detect_anomalies, explain_anomaly tools; llm.py schemas
- [ ] Phase 232: maintenance addon (maintenance.equipment, maintenance.request); tests/test_maintenance_phase232.py
- [ ] Phase 233: event addon (event.event, event.registration); tests/test_event_phase233.py

## Phase 218-225 (ERP Phases 218-225)

- [ ] Phase 218: LLM tool schemas synced (all TOOL_REGISTRY tools in _TOOL_SCHEMAS)
- [ ] Phase 219: ORM sudo(), with_context(), with_user(), _order
- [ ] Phase 220: AI lead scoring (score_lead, assign_lead), ai_score on crm.lead
- [ ] Phase 221: sale_subscription module, recurring invoice cron
- [ ] Phase 222: process_document tool, POST /ai/process-document
- [ ] Phase 223: ir.dashboard.layout, Customize Dashboard
- [ ] Phase 224: fleet module (vehicles, contracts, fuel, services)
- [ ] Phase 225: /health returns version, /metrics Prometheus format

## Phase 217 (HR Expansion)

- [ ] hr_attendance: hr.attendance, /hr/attendance/kiosk
- [ ] hr_recruitment: hr.applicant, hr.recruitment.stage, hr.job extension, /jobs/<id>/apply
- [ ] hr_contract: hr.contract (wage, date_start, date_end, state)

## Phase 216 (E-Commerce website_sale)

- [ ] website_sale module: /shop with AI Recommended for you
- [ ] suggest_products tool; /shop/ai-recommendations API
- [ ] website_sale in DEFAULT_SERVER_WIDE_MODULES

## Phase 215 (AI Analytics & Forecasting)

- [ ] analyze_kpi, forecast_metric tools in ai_assistant
- [ ] ai.forecast model for storing forecasts
- [ ] Dashboard AI Insights: anomaly alerts, forecast display

## Phase 214 (AI Autonomous Agents)

- [ ] POST /ai/agent/run (goal, max_iter); GET /ai/agent/status?task_id=
- [ ] ai.agent.task model; create_record, update_record, generate_report, schedule_action tools
- [ ] Chat panel: Agent mode checkbox when LLM enabled; collapsible steps display
- [ ] ReAct loop: plan -> execute tool -> observe -> decide next step

## Phase 213 (Transient Models & Wizards)

- [ ] TransientModel: _transient_ttl_hours; TTL vacuum when create_date exists
- [ ] vacuum_transient_models in cron
- [ ] base.wizard.confirm, account.reconcile.wizard

## Phase 212 (Binary Fields & File Upload)

- [ ] ir.attachment: datas, mimetype, file_size, checksum
- [ ] POST /web/binary/upload (ufile or file)
- [ ] GET /web/content/<model>/<id>/<field>/<filename>
- [ ] Binary/image file widget in form views

## Phase 211 (Search View, Saved Filters & Action Domain)

- [ ] Search view with filters and group_bys from XML; filter chips in list view
- [ ] parseFilterDomain substitutes uid for domains like [('user_id','=',uid)]
- [ ] Action domain and context passed from ir.actions.act_window to frontend
- [ ] Saved filters (localStorage + ir.filters) and filter chips in renderList

## Phase 210 (ORM Computed Fields & Model Inheritance)

- [ ] Non-stored computed fields computed on read (amount_total, price_subtotal, etc.)
- [ ] Stored computed fields (display_name, amount_total on purchase) recomputed on create/write
- [ ] _inherit: deferred merge when base not yet registered; fields/methods merged into base model
- [ ] tests/test_computed_fields.py, tests/test_model_inheritance.py pass

## Phase 209 (E2E Test Coverage & CI Enhancements)

- [ ] tests/e2e/test_crm_lead_tour.py, test_orders_tour.py
- [ ] pytest-cov for coverage; CI uploads coverage-report artifact
- [ ] E2E: python scripts/with_server.py --server "./erp-bin server" --port 8069 -- pytest tests/e2e/ -v

## Phase 208 (REST API v1 & OpenAPI Spec)

- [ ] /api/v1/<model>: GET list/read, POST create, PUT update, DELETE unlink
- [ ] Bearer token auth; domain, fields, limit, offset, order query params
- [ ] /api/v1/openapi.json, /api/v1/docs (Swagger UI)
- [ ] tests/test_rest_api_phase208.py passes

## Phase 207 (Mass Mailing & Email Marketing)

- [ ] addons/mailing: mailing.list, mailing.list.partner, mailing.mailing, mailing.tracking
- [ ] action_send queues mail.mail per subscriber; tracking pixel and link rewriting
- [ ] /mail/track/open/<token>, /mail/track/click/<token>?url=..., /mail/unsubscribe/<token>
- [ ] Marketing > Mailing Lists, Marketing > Mailings
- [ ] tests/test_mailing_phase207.py passes

## Phase 206 (Multi-Step Approval Chains)

- [ ] approval.rule: parent_rule_id for chaining; approval.request: step, next_rule_id, delegate_to_user_id
- [ ] action_approve creates next step when rule has parent_rule_id; action_reject, action_delegate
- [ ] check_approval_rules on write/create when amount crosses min_amount
- [ ] Settings > Approval Rules, Settings > Approval Requests
- [ ] tests/test_approval_phase206.py passes

## Phase 201 (Dashboard & Reporting Enhancements)

- [ ] Default widgets: Sales This Month, Open Invoices, Low Stock, Overdue Tasks
- [ ] KPI drill-down: click KPI → filtered list (orders, invoices, products, tasks)
- [ ] _load_dashboard_widgets adds missing widgets on db init/upgrade
- [ ] tests/test_dashboard_phase201.py passes

## Phase 200 (Multi-Currency Improvements)

- [ ] account.move: amount_residual in invoice currency
- [ ] account.bank.statement: currency_id
- [ ] Bank reconciliation converts statement amount when currency differs
- [ ] tests/test_multi_currency_phase200.py passes

## Phase 199 (Customer Portal - Invoice Payment)

- [ ] Portal invoice detail: Pay Online button when state in (draft, posted)
- [ ] /my/invoices/<id>/pay: provider selection, creates payment.transaction
- [ ] Demo provider: marks invoice paid immediately; manual: pending page
- [ ] tests/test_portal_invoice_pay_phase199.py passes

## Phase 198 (Lot/Serial Number Tracking)

- [ ] stock.lot has expiry_date; stock.move has lot_id
- [ ] Receipt: assign lot_id on move; validate creates quant with lot
- [ ] Delivery: consume from lot (manual) or FIFO when no lot
- [ ] Inventory > Configuration > Lots menu
- [ ] tests/test_lot_serial_phase198.py passes

## Phase 197 (Purchase → Receipt → Vendor Bill)

- [ ] Confirm PO creates picking with purchase_id; bill_status on order
- [ ] Validate picking updates bill_status; Create Bill on picking creates from received qty
- [ ] action_create_bill on order uses received qty when pickings have done moves
- [ ] tests/test_purchase_receipt_bill_phase197.py passes

## Phase 196 (Sale → Delivery → Invoice)

- [ ] Confirm SO creates picking with sale_id; delivery_status on order
- [ ] Validate picking updates delivery_status; Create Invoice on picking creates from delivered qty
- [ ] action_create_invoice on order uses delivered qty when pickings have done moves
- [ ] tests/test_sale_delivery_invoice_phase196.py passes

## Phase 195 (Reconciliation Wizard)

- [ ] Bank statement form: Reconcile button opens wizard; batch reconcile statement lines with journal items
- [ ] account.reconcile.wizard: select statement lines + move lines, action_reconcile links and sets reconciled_id
- [ ] tests/test_reconcile_wizard_phase195.py passes

## Phase 194 (Platform Fixes)

- [ ] bcrypt<4.1 for passlib compatibility; run `pip install "bcrypt>=4.0,<4.1"` if you see (trapped) bcrypt version error
- [ ] PGUSER=postgres when PostgreSQL role differs from system user
- [ ] WebSocket 426 is expected without --gevent-websocket; longpolling works

## Phase 193 (Bank Statements & Reconciliation)

- [ ] account.bank.statement, account.bank.statement.line models; Invoicing > Bank Statements
- [ ] account.journal type "bank"; default BANK journal and sequence
- [ ] _auto_reconcile matches statement line to account.move.line by amount + partner (asset_cash)
- [ ] POST /web/import/bank_statement: CSV with date, amount, name, partner; creates statement or lines
- [ ] tests/test_bank_statement_phase193.py passes

## Phase 192 (Timesheets)

- [ ] addons/hr_timesheet loaded (depends: base, account, hr, project)
- [ ] analytic.line: employee_id, task_id, project_id; project.task: timesheet_ids
- [ ] Timesheets > My Timesheets (filtered by employee_id.user_id), Timesheets > All Timesheets
- [ ] Task form shows timesheet_ids list
- [ ] tests/test_timesheet_phase192.py passes

## Phase 191 (Payment Terms)

- [ ] account.payment.term, account.payment.term.line models; Invoicing > Configuration > Payment Terms
- [ ] compute(value, date_ref) returns (amount, due_date) installments; balance/percent/fixed
- [ ] account.move: payment_term_id, invoice_date_due (computed); sale.order, purchase.order: payment_term_id
- [ ] Invoice creation from sale order copies payment_term_id; invoice_date_due recomputed after lines
- [ ] tests/test_payment_terms_phase191.py passes

## Phase 190 (Helpdesk Module)

- [ ] addons/helpdesk loaded (depends: base, mail)
- [ ] Helpdesk > Tickets (kanban, list, form); Helpdesk > Configuration > Stages
- [ ] helpdesk.ticket: stage_id, partner_id, user_id, message_ids
- [ ] tests/test_helpdesk_phase190.py passes

## Phase 185 (Bulk Operations)

- [ ] List views: checkbox column with Select All; bulk action bar (Delete Selected, Clear) when rows selected
- [ ] Bulk delete calls rpc unlink on selected IDs; bar hidden when no selection

## Phase 184 (Chatter File Attachments)

- [ ] Chatter: file input, upload to /web/attachment/upload before posting
- [ ] message_post(attachment_ids=[...]) links attachments to message
- [ ] GET /web/attachment/download/<id> serves file

## Phase 183 (PDF Report Templates)

- [ ] Print button on sale.order, account.move, purchase.order, stock.picking opens /report/html/<model>/<id>
- [ ] Templates: Sale Order, Invoice, Purchase Order, Delivery Slip

## Phase 182 (Accounting Reports)

- [ ] Invoicing > Reports > Trial Balance, Profit & Loss, Balance Sheet
- [ ] Date range picker; RPC calls account.account.get_trial_balance, get_profit_loss, get_balance_sheet

## Phase 181 (Tax Management)

- [ ] Invoicing > Configuration > Taxes; account.tax model
- [ ] Sale/Purchase order lines: tax_id, taxes_id; price_subtotal includes tax
- [ ] account.move.line: tax_ids

## Phase 180 (Drag-and-Drop Kanban)

- [ ] Kanban cards draggable; drop on column calls write RPC with group_by field
- [ ] Works for crm.lead (stage_id), project.task (stage_id -> project.task.type)

## Phase 179 (CSV/Excel Import)

- [ ] Import button opens modal; file input accepts .csv and .xlsx
- [ ] POST /web/import/preview returns headers and first 5 rows
- [ ] POST /web/import/execute imports with column mapping; uses Model.import_data

## Phase 178 (Mail Templates)

- [ ] Settings > Email Templates menu; mail.template model with Jinja2 subject/body
- [ ] Server actions: state=email uses template_id to send mail via mail.template.send_mail()

## Phase 176 (Editable List View)

- [ ] List views with editable="bottom" support inline editing (parsed from XML)

## Phase 177 (Search Panel)

- [ ] Search views with &lt;searchpanel&gt; expose hierarchical filters (parsed from XML)

## Phase 173 (Stock Valuation)

- [ ] product.product has standard_price and cost_method (standard/average)
- [ ] stock.valuation.layer created on stock moves; Inventory > Reporting > Valuation

## Phase 172 (Incoming Email to Chatter)

- [ ] Incoming emails with In-Reply-To header matching a sent mail.message are posted to chatter (not new leads)
- [ ] Run `erp-bin db upgrade -d <db>` to add mail.message.message_id column

## Phase 171 (Field Change Tracking)

- [ ] Models with MailThreadMixin (e.g. crm.lead): tracked field changes create mail.message in chatter
- [ ] Use tracking=True on fields that should appear in audit trail (stage_id, partner_id, state, etc.)

## Phase 162 (DB Upgrade)

- [ ] `erp-bin db upgrade -d <db>` runs init_schema + load_default_data idempotently
- [ ] Does NOT drop existing user data (partners, orders, leads, etc.)

## Phase 169 (Responsive Layout + Mobile)

- [ ] @media (max-width: 768px): hamburger menu, stacked nav, full-width forms
- [ ] @media (max-width: 480px): single-column forms, touch targets (min 44px)
- [ ] Kanban single-column on mobile; list horizontal scroll with sticky first column

## Phase 168 (Analytic Accounting)

- [ ] analytic.account, analytic.line models; Invoicing > Configuration > Analytic Accounts
- [ ] hr.expense has analytic_account_id; expense approval creates analytic.line when set
- [ ] project.project has analytic_account_id for cost tracking

## Phase 167 (Calendar Module)

- [ ] calendar in DEFAULT_SERVER_WIDE_MODULES; run `erp-bin db upgrade -d <db>` after adding
- [ ] Calendar > Meetings menu; calendar.event, calendar.attendee models
- [ ] Portal: /my/calendar lists events where user's partner is attendee; /my/calendar/<id> detail
- [ ] My Calendar link in portal nav (when logged in as portal user)

## Post-deployment

- [ ] Verify web client loads at /
- [ ] Verify jsonrpc responds at /jsonrpc (object service requires session)
- [ ] Verify static assets serve from /<module>/static/
- [ ] Verify Contacts list loads (login, click Contacts)
- [ ] Verify Leads list loads (login, click Leads)
- [ ] Verify Project > Projects and Project > Tasks menus load
- [ ] Verify Knowledge > Articles and Knowledge > Categories menus load
- [ ] Verify AI tools: `GET /ai/tools` returns 401 when not authenticated; returns tool list when session present

## AI Module (Phases 9–12)

- [ ] ai_assistant in server_wide_modules (core/tools/config.py)
- [ ] /ai/tools, /ai/chat, /ai/retrieve, /ai/nl_search, /ai/extract_fields routes registered
- [ ] ai.audit.log, ai.document.chunk tables created (db init)
- [ ] Chat panel: AI button in webclient

## Phase 120 (Multi-worker mode)

- [ ] --workers=N starts N HTTP workers + 1 cron worker (prefork)
- [ ] Cron worker runs ir.cron.run_due every 60s
- [ ] SIGTERM triggers graceful shutdown

## Phase 121 (Module scaffold CLI)

- [ ] erp-bin scaffold <name> [dest] creates module with __manifest__.py, models, views, security, controllers

## Phase 125 (Two-Factor Authentication TOTP)

- [ ] addons/auth_totp loaded (core/tools/config.py DEFAULT_SERVER_WIDE_MODULES)
- [ ] pip install pyotp qrcode (or requirements.txt)
- [ ] Settings > Two-Factor Authentication: enable TOTP, scan QR code, confirm code
- [ ] Login flow: when TOTP enabled, password login redirects to /web/login/totp for 6-digit code
- [ ] Routes: /web/totp/status, /web/totp/begin_setup, /web/totp/confirm_setup, /web/totp/disable

## Phase 124 (AI Conversation Memory)

- [ ] ai.conversation model stores user_id, messages JSON, model_context, active_id
- [ ] /ai/chat accepts conversation_id; loads prior messages; returns conversation_id
- [ ] Chat panel: "New" button clears conversation; sends model_context/active_id from current view
- [ ] window.chatContext set by main.js when viewing form/list

## Phase 123 (AI-Assisted Data Entry)

- [ ] POST /ai/extract_fields (model, text) returns {fields}; auth required
- [ ] AI Fill button on new lead/partner forms; paste text to extract name, email, phone, description
- [ ] When LLM enabled: OpenAI extracts structured fields; fallback: regex for email/phone

## Phase 122 (AI Natural Language Search)

- [ ] POST /ai/nl_search (model, query, limit) returns {domain, results}; auth required
- [ ] AI Search button in list views (Contacts, Leads, etc.); converts NL query to domain via LLM or ilike fallback
- [ ] When LLM enabled: OpenAI converts query to Odoo domain; fallback: ilike on name/email/description

## Phase 118 (Accounting foundation)

- [ ] addons/account loaded (depends: base, sale)
- [ ] Default chart of accounts and journals (SALE, PURCH, MISC) seeded on db init via _load_account_data
- [ ] sale.order.action_create_invoice creates account.move (customer invoice) with journal entries
- [ ] Invoicing > Invoices, Invoicing > Configuration menus

## Phase 117 (Purchase module)

- [ ] addons/purchase loaded (depends: base, stock)
- [ ] purchase.order.button_confirm creates stock.picking (incoming receipt) with stock.move lines
- [ ] res.partner gains supplier_rank field
- [ ] Purchase > Orders, Purchase > Products menus

## Phase 116 (Inventory/Stock module)

- [ ] addons/stock loaded (depends: base, sale)
- [ ] sale.order.action_confirm creates stock.picking (delivery order) with stock.move lines
- [ ] Default locations (Stock, Output, Vendors, Customers), warehouse, picking types seeded on db init
- [ ] Inventory > Operations > Transfers, Configuration > Warehouses menus

## Phase 227 (Point of Sale)

- [ ] pos.config with journal_id, pricelist_id, warehouse_id
- [ ] pos.session: open (starting cash), opened, closed
- [ ] pos.order: lines, action_pay, action_done (stock moves + accounting)
- [ ] Point of Sale menu: Configuration, Sessions, Orders
- [ ] tests/test_pos_phase227.py passes

## Phase 226 (Workflow Automation Engine)

- [ ] base.automation on_create, on_write, on_unlink, on_time triggers work
- [ ] action_type: update, webhook, server_action execute correctly
- [ ] tests/test_automation_phase226.py passes (use _test_automation_226 and _test_automation_226_ontime DBs)

## Phase 152 (Server Action Fix + Technical Settings)

- [ ] base.automation on_create triggers server action; records.write() in code executes correctly
- [ ] Settings > Technical > Scheduled Actions (ir.cron list/form)
- [ ] Settings > Technical > Server Actions (ir.actions.server list/form)
- [ ] Settings > Technical > Sequences (ir.sequence list/form)
- [ ] tests/test_server_actions_phase119.py passes

## Phase 157 (Portal Signup + Invoice Portal)

- [ ] /web/signup creates portal users (Phase 98)
- [ ] /my/invoices lists customer invoices for portal user's partner
- [ ] /my/invoices/<id> detail + PDF download
- [ ] Portal record rule: account.move (out_invoice, partner_id)
- [ ] tests/test_portal_signup_phase157.py passes

## Phase 155 (Product Variants)

- [ ] product.template, product.attribute, product.attribute.value, product.template.attribute.line
- [ ] product.product _inherits product.template; attribute_value_ids for variant values
- [ ] Shop product detail shows variant selector when template has attribute lines
- [ ] tests/test_product_variant_phase155.py passes

## Phase 154 (Multi-Currency Conversion)

- [ ] res.currency.convert(amount, from_id, to_id, date) uses res.currency.rate
- [ ] sale.order, purchase.order have currency_id (default from company)
- [ ] purchase.order.amount_total computed from order_line (stored)
- [ ] account.move/account.move.line: currency_id, amount_currency for multi-currency invoices
- [ ] tests/test_currency_phase154.py passes

## Phase 161 (Expense Module)

- [ ] addons/hr_expense loaded (depends: base, hr, account)
- [ ] hr.expense, hr.expense.sheet models; workflow: draft → submit → approve → done
- [ ] action_done creates account.move (expense debit, payable credit)
- [ ] ir.sequence hr.expense.sheet seeded on db init
- [ ] tests/test_hr_expense_phase161.py passes

## Phase 160 (Advanced Form Widgets)

- [ ] priority (stars), progressbar, phone, email, url widgets in form/list
- [ ] crm.lead.priority, project.task.priority/progress, res.partner.mobile/website
- [ ] tests/test_widgets_phase160.py passes

## Phase 159 (Webhooks)

- [ ] ir.webhook model (model_name, trigger, url, secret); ir.webhook.log
- [ ] run_webhooks on create/write/unlink; HMAC-SHA256 in X-Webhook-Signature
- [ ] tests/test_webhook_phase159.py passes

## Phase 158 (Gantt View)

- [ ] Gantt view for project.task (date_start, date_deadline) and mrp.production (date_start, date_finished)
- [ ] loadGanttData, renderGanttView in main.js
- [ ] tests/test_gantt_phase158.py passes

## Phase 153 (MRP Manufacturing)

- [ ] addons/mrp loaded (depends: base, stock, sale)
- [ ] Manufacturing > Orders, Bills of Materials, Work Centers menus
- [ ] mrp.production: create() assigns MO/00001 via ir.sequence
- [ ] action_confirm creates stock moves (raw: internal→production, finished: production→internal)
- [ ] action_done validates moves and updates stock.quant
- [ ] Production location created on db init (_load_mrp_data)
- [ ] tests/test_mrp_phase153.py passes

## Phase 114 (RAG bulk reindex cron)

- [ ] ai.rag.reindex model registered; run() indexes res.partner and crm.lead into ai.document.chunk
- [ ] "RAG bulk reindex" cron seeded on db init when ai_assistant loaded (60 min interval)
- [ ] erp-bin cron -d &lt;db&gt; runs ai.rag.reindex.run (up to 500 records per run)

## Phase 115 (Gevent WebSocket for production)

- [ ] Run with --gevent-websocket for WebSocket support (same port as HTTP)
- [ ] Install gevent: pip install gevent (optional; fallback to Werkzeug + longpolling if not installed)
- [ ] Without --gevent-websocket: Werkzeug dev server returns 426 for /websocket/, client uses longpolling

## Phase 29 (CLI Shell + Module Install)

- [ ] `erp-bin module list` shows base, web, crm, ai_assistant
- [ ] `erp-bin module install -d <db> -m crm` completes without errors
- [ ] `erp-bin shell -d <db>` opens REPL with `env` and `registry`
- [ ] From shell, `env['res.partner'].search_read([])` works

## Phases 105–107 (RPC Stabilization, Dashboard, Portal Verification)

- [ ] Phase 105: Contacts/Leads list/form flows no repeated call_kw 500s; test_rpc_read and test_report pass
- [ ] RPC fix: search_read with fields in args+kwargs no longer returns 500; _merge_args_kwargs deduplicates params
- [ ] CORS: If "access control checks" on call_kw, set `--cors-origin=http://<your-origin>` or ensure same origin (localhost vs 127.0.0.1); OPTIONS preflight now supported
- [ ] Phase 106: Dashboard homepage and Settings > Dashboard Widgets work on fresh init and upgraded DB
- [ ] Phase 107: Portal users see only allowed records; upgrade idempotent for base module

## Phases 79–83 (Settings, ir.filters, Chatter, Calendar, Form UX)

- [ ] Settings page: General (company name), Users link, System Parameters table, API Keys
- [ ] Saved filters: Save/load from ir.filters (DB); localStorage fallback when RPC fails
- [ ] Lead form: Chatter section with messages; Send posts via message_post
- [ ] Leads: List | Kanban | Calendar view switcher; calendar month grid with date_deadline
- [ ] Form: Required field validation before save; "You have unsaved changes" banner; confirm on navigation when dirty

## Phase 84 (Graph view)

- [ ] Leads: List | Kanban | Graph | Calendar view switcher; Graph shows bar/line/pie chart
- [ ] Graph: read_group RPC; Chart.js from CDN; stage_id grouped, expected_revenue summed
- [ ] Chart type switcher: Bar, Line, Pie buttons

## Phase 85 (Search facets + group by)

- [ ] Leads list: Filter buttons (Opportunities, Leads) toggleable; Group by Stage dropdown
- [ ] Facet chips above list when filters/group-by active; removable via ×
- [ ] Grouped list rows: group headers, subtotals for expected_revenue when grouped by Stage

## Phase 86 (Import wizard)

- [ ] Import button in list toolbar (next to Export)
- [ ] CSV upload modal: file picker, preview, column mapping, Import/Cancel
- [ ] import_data RPC creates/updates records; result summary (created/updated/errors)

## Phase 87 (QWeb-style reports)

- [ ] /report/html/crm.lead_summary/<ids> renders Jinja2 template with record data
- [ ] /report/pdf/... converts to PDF (weasyprint) or falls back to HTML
- [ ] Print button on lead form and list opens report in new tab

## Phase 110 (Report & action framework – metadata-driven)

- [ ] ir.actions.report records seeded on db init and upgrade (_load_ir_actions_reports)
- [ ] Report lookup uses ir.actions.report when registry is empty (metadata-driven)
- [ ] /web/load_views returns reports map (model -> report_name) from ir.actions.report
- [ ] Print button uses report name from registry when available

## Phase 113 (Runtime and test harness)

- [ ] CI: unit tests run in GitHub Actions with PostgreSQL service
- [ ] E2E: Playwright tour runs on main/master (login, list, form)
- [ ] Multi-db: session stores db; registry per DB; data isolation (test_multi_db_phase113)

## Phase 112 (Minimal Sales module)

- [ ] addons/sale: sale.order, sale.order.line, product.product
- [ ] Sales menu: Orders, Products; list/form views
- [ ] Orders form: order lines (product, qty, price, subtotal); Confirm/Cancel buttons

## Phase 111 (Portal and collaboration)

- [ ] /my/leads/<id> shows lead detail with messages, activities, attachments
- [ ] Portal user can post message via /my/leads/<id>/message
- [ ] /my/attachment/<id> serves attachment when user has access
- [ ] Record rules: portal users read mail.message, mail.activity, ir.attachment for their leads

## Phase 88 (AI LLM integration)

- [ ] GET /ai/config returns llm_enabled, llm_model (auth required)
- [ ] Settings > AI Configuration: OpenAI API key, Enable LLM toggle, Model selector (gpt-4o-mini, gpt-4o, gpt-4-turbo)
- [ ] ir.config_parameter: ai.openai_api_key, ai.llm_enabled, ai.llm_model
- [ ] When ai.llm_enabled=1: Chat panel shows prompt-only mode (no tool/model dropdown); POST /ai/chat with prompt uses OpenAI function-calling
- [ ] RAG: retrieve_chunks injected into system message before LLM call

## Phase 136 (Vector embeddings for RAG)

- [ ] pip install pgvector (optional; enables semantic search)
- [ ] PostgreSQL: CREATE EXTENSION vector (run on db init)
- [ ] ai.document.chunk.embedding column (vector 1536); index_record_for_rag embeds via OpenAI text-embedding-3-small
- [ ] retrieve_chunks: cosine similarity (<=>) when embeddings exist; ilike fallback otherwise
- [ ] Chat panel: "Thinking..." loading indicator; tool/model row hidden when LLM enabled
- [ ] pip install openai for LLM; OPENAI_API_KEY env or ai.openai_api_key in Settings

## Phases 99–103 (Infrastructure, ORM Depth, Website, Migrations, Views)

- [ ] Phase 99: Dockerfile, docker-compose, /health, security headers, CORS, persistent sessions
- [ ] Phase 100: @api.depends recompute; Many2one ondelete cascade/set null; FK constraints
- [ ] Phase 101: addons/website; /my portal; portal users see only own leads

## Phase 144 (Profiling)

- [ ] Run with --debug=profiling for request timing and ORM query stats
- [ ] Response headers: X-Response-Time-Ms, X-Query-Count, X-Query-Time-Ms

## Phase 145 (Backup/Restore)

- [ ] Set --backup-dir=PATH or ERP_BACKUP_DIR env for cron backups
- [ ] ir.config_parameter db.backup_dir alternative
- [ ] erp-bin db backup -d &lt;db&gt; [-o path]; erp-bin db restore -d &lt;db&gt; -f &lt;file&gt;
- [ ] "Database backup" cron runs daily when base.db.backup loaded

## Phase 143 (Shop E2E, Order Email, My Orders)

- [ ] /shop E2E: pytest tests/e2e/test_shop_tour.py (shop → cart → checkout → confirmation)
- [ ] Order confirmation: sale.order.action_confirm creates mail.mail; cron sends
- [ ] /my/orders: portal users see their orders; /my/orders/<id> order detail
- [ ] Portal nav: My Orders link
- [ ] Demo products: db init seeds Widget A/B/C when no products exist

## Phase 142 (Website shop cart + checkout)

- [ ] /shop/cart: view cart, add via ?add=&lt;product_id&gt;, remove via ?remove=&lt;product_id&gt;
- [ ] Cart stored in erp_cart cookie (base64 JSON); anonymous checkout supported
- [ ] /shop/checkout: address form (name, email, street, city); creates res.partner for guests; creates sale.order with order_line; action_confirm
- [ ] /shop/confirmation: thank-you page; cart cookie cleared on checkout
- [ ] Phase 102: erp-bin db upgrade -d <db> -m <module>; core/upgrade/; ir.module.module
- [ ] Phase 103: Leads form tag_ids many2many_tags chip widget (add/remove tags via dropdown)
- [ ] Phase 104: Html field contenteditable widget; Image field preview/upload; activity view grouping

## Phases 94–98 (i18n, WebSocket, Monetary, Mail Module, Portal)

- [ ] Phase 94: Navbar language selector; /web/translations; .po files in addons/base/i18n, addons/web/i18n
- [ ] Phase 95: WebSocket at /websocket/; bus_service.js uses WS first, longpoll fallback
- [ ] Phase 96: crm.lead expected_revenue is Monetary; currency_id in form; list formats monetary with 2 decimals
- [ ] Phase 97: addons/mail module; mail models moved from base; crm depends on mail; mail in server_wide_modules
- [ ] Phase 98: /web/signup creates portal users; base.group_portal; res.users.partner_id, res.partner.user_id; login page link to signup

## Phase 93 (Dashboard homepage)

- [ ] Home/Dashboard shows KPI cards (Open Leads, Expected Revenue, My Activities)
- [ ] KPI cards link to filtered lists (#leads?domain=... for Open Leads)
- [ ] Dashboard: Upcoming Activities, Quick Actions (New Lead, New Contact), Recent Items
- [ ] Recent Items populated from sessionStorage when viewing lead/contact forms
- [ ] Settings > Dashboard Widgets: list, add, edit, delete ir.dashboard.widget
- [ ] ir.dashboard.widget table created on db init; default widgets from _load_dashboard_widgets

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

## Phases 69–73 (default_get, name_get, attrs, copy, statusbar)

- [ ] default_get: New form pre-fills from field defaults and action context
- [ ] name_get/name_search: Many2one fields use searchable input with autocomplete
- [ ] Attrs: Fields with invisible/readonly/required conditions toggle on form change
- [ ] Copy: Duplicate button in form; copy creates record with " (copy)" suffix
- [ ] Statusbar: Leads form shows stage_id as clickable pipeline pills; click updates stage

## Phases 74–78 (Form structure, activity mixin, server actions, export, design system)

- [ ] Form structure: Leads form has header (statusbar) + sheet; button_box supported
- [ ] mail.activity: Re-run `./erp-bin db init -d <db>` to create mail_activity table
- [ ] Activity mixin: crm.lead.activity_ids now points to mail.activity; activity_schedule RPC
- [ ] Mark Won button: Leads form header has Mark Won; click sets stage to Won
- [ ] List export: Export button in list toolbar; CSV download with display names
- [ ] CSS design system: --space-*, --card-gap, --color-* tokens; .o-card-gradient available

## Phases 67–68 (One2many editable, multi-level Related)

- [ ] One2many editable: Leads form activity_ids table has Add/Delete; create lead with activities; update lead adds/updates/removes activities
- [ ] Multi-level Related: res.partner.country_code = Related("country_id.code"); search_read returns country_code; test_related_field_multi_level passes
- [ ] Re-run `./erp-bin db init -d <db>` to add country_code column on res.partner

## Phases 61–66 (fields_get, model/view inheritance, constraints, breadcrumbs, prefetch)

- [ ] fields_get: RPC `fields_get` returns field metadata; /web/load_views includes `fields_meta` per model
- [ ] Form labels: field.string from metadata (e.g. "Is a Company" not "is_company")
- [ ] Selection options from metadata: no hardcoded helpers needed for new models
- [ ] Model inheritance: `_inherit = "res.partner"` merges fields/methods; verify with `fields_get`
- [ ] View inheritance: `inherit_id` + xpath extends views; positions: inside/after/before/replace
- [ ] SQL constraints: `_sql_constraints` applied on db init; IntegrityError returns user-friendly message
- [ ] Python constraints: `@api.constrains('field')` runs validation on create/write; raises ValidationError
- [ ] Breadcrumbs: "Contacts / John Doe" trail on form; click list crumb returns to list; record name shown after load
- [ ] Prefetch: search_read returns partner_id_display etc.; list view avoids extra RPC for Many2one names
- [ ] Re-run `./erp-bin db init -d <db>` to apply new SQL constraints

## Phases 56–60 (Pagination, toasts, form layout, related fields, onchange)

- [ ] List views: pager "1-80 of N | Prev | Next"; sortable column headers (click toggles asc/desc)
- [ ] Toast notifications: success/error/warning/info; auto-dismiss 4s; replaces alert()
- [ ] Form layout: group (2-col grid), notebook (tabs), page; res.partner form has Contact group + Address tab
- [ ] Related fields: crm.lead.partner_name from partner_id.name; stored on create/write
- [ ] Onchange: changing country_id clears state_id; server _onchange_country_id; debounced RPC on field change/blur

## Phases 51–55 (Action domain, search view, saved filters, computed fields, binary)

- [ ] List views: action domain applied as default filter; search bar uses search_fields from XML
- [ ] Saved filters: Filters dropdown in list; Save current search to localStorage
- [ ] res.partner.display_name: stored computed field; search_read returns display_name
- [ ] Attachments menu (Settings): ir.attachment list/form; file upload for datas field (base64)

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

- [ ] Leads form: tag_ids many2many_tags widget (chip UI for crm.tag; add via dropdown, remove via ×)
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
