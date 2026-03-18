# ERP Phases 194–201 Plan

Platform is at **Phase 193 / v1.56.0**. Phases 186–193 complete (Payroll, Pricelists, Variants, Orderpoints, Helpdesk, Payment Terms, Timesheets, Bank Statements). This plan covers the next 8 phases for production readiness.

---

## Phase 194: Platform Fixes (bcrypt, WebSocket, PGUSER)

**Goal:** Fix runtime warnings and improve first-run experience.

| Task | Implementation |
|------|----------------|
| bcrypt compatibility | Pin `passlib[bcrypt]` and `bcrypt` versions; handle `__about__` AttributeError (passlib 1.7.x vs bcrypt 4.x) |
| WebSocket 426 | Document `--gevent-websocket` for real-time; or suppress 426 when longpolling works |
| PGUSER in README | Add "Run with PGUSER=postgres if PostgreSQL role differs from system user" |
| requirements.txt | Add explicit bcrypt/passlib versions for compatibility |

**Files:** `requirements.txt`, `README.md`, `DeploymentChecklist.md`, optionally `core/http/auth.py` (bcrypt fallback).

---

## Phase 195: Account Move Reconciliation Wizard

**Goal:** Full reconciliation of bank statement lines with journal items; reconcile multiple lines at once.

| Task | Implementation |
|------|----------------|
| Reconciliation wizard | `account.reconcile.wizard` transient model: select statement lines + move lines, validate |
| Batch reconcile | Button on statement form: "Reconcile" opens wizard; match by amount + partner |
| Reconcile state | `account.move.line`: `reconciled` boolean or `reconciled_id`; statement line links to reconciled set |
| Views | Wizard form; Reconcile button on bank statement |

**Files:** `addons/account/models/account_reconcile_wizard.py`, `addons/account/views/account_views.xml`, `addons/account/security/ir.model.access.csv`.

---

## Phase 196: Sale Order → Delivery → Invoice Workflow

**Goal:** Complete order-to-cash: confirm SO → create picking → deliver → create invoice from delivered qty.

| Task | Implementation |
|------|----------------|
| sale.order | `delivery_status` (no/partial/full); `invoice_status` already exists |
| stock.picking | Link to sale.order via `origin`; `sale_id` Many2one when created from SO |
| action_confirm | Create picking with move lines from order_line |
| action_create_invoice | Option: invoice delivered qty only (from picking move states) |
| Invoice from delivery | Button on picking: "Create Invoice" → invoice with delivered quantities |

**Files:** `addons/account/models/sale_order.py`, `addons/stock/models/stock_picking.py`, `addons/stock/models/stock_move.py`, views.

---

## Phase 197: Purchase Order → Receipt → Vendor Bill ✅

**Goal:** Complete procure-to-pay: confirm PO → create receipt → receive → create vendor bill from received qty.

| Task | Implementation |
|------|----------------|
| purchase.order | `bill_status` (no/partial/full) |
| stock.picking | Link to purchase.order; `purchase_id` Many2one |
| action_create_bill | Button on receipt: create account.move (in_invoice) from received quantities |
| Three-way match | Bill lines reference purchase order lines; optional: match to receipt |

**Files:** `addons/purchase/models/purchase_order.py`, `addons/account/models/` (purchase bill creation), `addons/stock/models/stock_picking.py`.

---

## Phase 198: Lot/Serial Number Tracking ✅

**Goal:** Track products by lot or serial number for traceability and expiry.

| Task | Implementation |
|------|----------------|
| stock.lot | `name`, `product_id`, `company_id`, `expiry_date` (optional) |
| stock.move | `lot_id` Many2one; `lot_ids` for multi-lot moves |
| stock.quant | `lot_id` Many2one; qty per lot per location |
| Receipt | Assign/create lot on incoming move |
| Delivery | Consume specific lot (FIFO or manual selection) |
| Views | Lot form/list; lot_id on move/quant; Inventory > Lots |

**Files:** `addons/stock/models/stock_lot.py`, extend `stock.move`, `stock.quant`, `addons/stock/views/stock_views.xml`.

---

## Phase 199: Customer Portal (Orders & Invoices) ✅

**Goal:** Portal users can view their orders and invoices, pay online.

| Task | Implementation |
|------|----------------|
| Portal auth | Extend signup/login for portal users; `res.users` has `share=True` for portal |
| Portal routes | `/my/orders`, `/my/invoices` (website module may have /my/*) |
| Record rules | Portal users see only their own orders (partner_id = user.partner_id) |
| Order list | Read-only list of sale.order for partner |
| Invoice list | Read-only list of account.move (out_invoice) for partner |
| Payment link | Invoice form: "Pay" button → payment provider (if payment module) |

**Files:** `addons/website/controllers/` (or new `addons/portal/`), `addons/base/security/ir_rule.xml`, portal templates.

---

## Phase 200: Multi-Currency Improvements ✅

**Goal:** Proper multi-currency for invoices, orders, and bank statements.

| Task | Implementation |
|------|----------------|
| res.currency.rate | Daily rates; `Currency.convert(amount, from_cur, to_cur, date)` uses rate |
| account.move | `currency_id`; lines in company currency; `amount_residual` in invoice currency |
| sale.order / purchase.order | `currency_id`; `amount_total` in order currency |
| Bank statement | Statement currency vs company currency; convert for reconciliation |
| Currency selector | Company default; order/invoice can override |

**Files:** `addons/base/models/res_currency.py`, `addons/account/models/account_move.py`, `addons/sale/`, `addons/purchase/`.

---

## Phase 201: Dashboard & Reporting Enhancements ✅

**Goal:** Actionable KPIs and drill-down from dashboard.

| Task | Implementation |
|------|----------------|
| Dashboard KPIs | Sales this month (count), open invoices (sum amount_residual), low stock (count qty<5), overdue tasks (count) |
| KPI drill-down | Click KPI → open filtered list with domain (model-to-route: sale.order→orders, account.move→invoices, product.product→products, project.task→tasks) |
| Report widgets | ir.dashboard.widget; get_data returns domain for drill-down |
| Inventory report | (Future) Stock by product; valuation summary |
| Sales report | (Future) Revenue by period, by product |

**Files:** `addons/web/static/src/main.js` (renderDashboard modelToRoute), `core/db/init_data.py` (_load_dashboard_widgets), `addons/base/models/ir_dashboard.py`.

---

## Key File Touch Summary

| File | Phases |
|------|--------|
| `requirements.txt` | 194 |
| `README.md`, `DeploymentChecklist.md` | 194 |
| `addons/account/models/account_reconcile*.py` | 195 |
| `addons/account/models/sale_order.py` | 196 |
| `addons/stock/models/stock_picking.py` | 196, 197 |
| `addons/purchase/models/purchase_order.py` | 197 |
| `addons/stock/models/stock_lot.py` | 198 |
| `addons/website/` or `addons/portal/` | 199 |
| `addons/base/models/res_currency.py` | 200 |
| `addons/web/static/src/main.js` | 201 |

---

## Priority Order

1. **194** – Platform fixes (low effort, high impact for new users)
2. **195** – Reconciliation wizard (completes bank workflow)
3. **196** – Sale → delivery → invoice (core order-to-cash)
4. **197** – Purchase → receipt → bill (core procure-to-pay)
5. **198** – Lot/serial (traceability for regulated industries)
6. **199** – Portal (customer self-service)
7. **200** – Multi-currency (international)
8. **201** – Dashboard (UX)

---

After each phase: update `changelog.md`, `DeploymentChecklist.md`, commit to Git.
