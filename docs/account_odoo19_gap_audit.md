# Account module: Odoo 19 CE vs ERP gap audit (Wave F)

**Reference tree:** `odoo-19.0/addons/account` was **not present** in the workspace at audit time. This document inventories **ERP** files and lists **behavioural** gap themes against a typical Odoo 19 Community `account` addon layout (model names and flows only—no upstream code pasted).

## ERP inventory (`erp-platform/addons/account`)

| Area | Files |
|------|--------|
| Core posting | `models/account_move.py`, `models/account_move_line.py` |
| Chart / journals | `models/account_account.py`, `models/account_journal.py` |
| Taxes / terms | `models/account_tax.py`, `models/account_payment_term.py` |
| Bank / reconcile | `models/account_bank_statement.py`, `models/account_reconcile.py`, `models/account_reconcile_wizard.py` |
| Reporting helpers | `models/account_report.py` (SQL trial balance, P&amp;L, balance sheet subset) |
| Bridges | `models/sale_order.py`, `models/stock_picking.py` |

## Odoo 19 `account` (expected breadth, read-only when tree available)

Odoo CE `account` typically spreads across many models: move/posting pipeline, full tax engine (fiscal positions, tax groups, repartition), payments, reconciliation widgets, assets, follow-ups, and—often separately—`account_reports` for statutory/analytic reporting. Exact file names should be taken from a local `odoo-19.0` checkout per `docs/odoo19_reference_map.md`.

## Gap table (behavioural)

| Theme | Odoo-style expectation (summary) | ERP today | Direction |
|-------|-----------------------------------|-----------|-----------|
| Posting gate | Draft-only post; balanced lines; lines require accounts; strict sequence/lock dates in full Odoo | Balanced lines + lines required (Phase 467+535); draft-only post; account on each line enforced | Close critical invariants first; defer lock dates / sequences |
| Move types / payments | Rich move types, payment registers, outstanding accounts | Narrow `move_type`; payments via `payment.transaction` bridge | Document subset; extend when sale/purchase need it |
| Taxes | Fiscal positions, included/excluded price, multi-tax ordering, repartition lines | `compute_all` percent/fixed; **single-tax price_include** (Phase 536) | Expand only with tests per flow |
| Bank / reconcile | Statement models, matching rules, partial reconcile, FX | Statement + `_auto_reconcile` + wizard (`action_reconcile`); `reconciled_id` string; **577** `account.reconcile.allocation` + wizard `allocate_amount` (partial slice; FX still deferred) | Partial **implemented** (allocation audit); FX = **deferred** |
| Reporting | Full reporting engine + optional `account_reports` | SQL TB / P&amp;L / BS helpers on `account.account` | **Deferred** full parity; keep subset documented |
| Security / audit | Record rules, tax audit, lock | `_audit` on `account.move`; base ACLs | Align when security track prioritises |

## Related tests (ERP)

- Posting: `tests/test_account_post_phase467.py`, `tests/test_account_post_phase535.py`
- Taxes: `tests/test_account_tax_compute_phase536.py`
- Bank / wizard: `tests/test_bank_statement_phase193.py`, `tests/test_reconcile_wizard_phase195.py`, `tests/test_bank_statement_action_reconcile_phase537.py`

## Parity matrix

See **Phases 535–538** in `docs/parity_matrix.md`.

## Phase 544 — explicit deferrals (Wave L / account+)

**Shipped (Wave M / Phase 546):** minimal **fiscal positions** — `account.fiscal.position`, `account.fiscal.position.tax` (source → destination `account.tax`), `sale.order.fiscal_position_id`, and `apply_fiscal_position_taxes()` to remap order line taxes. No automatic partner-based fiscal assignment yet.

**Shipped (Wave N / Phase 551):** same tax mapping on **`purchase.order`** / **`purchase.order.line`** (`taxes_id`, `apply_fiscal_position_taxes()`) and on **draft** **`account.move`** journal items (`tax_ids`, move-level `fiscal_position_id`, `apply_fiscal_position_taxes()`).

**Shipped (Wave O / Phase 555):** **`res.partner.fiscal_position_id`**; new sale orders default header **`fiscal_position_id`** from partner via **`sale.order._sale_order_prepare_vals`** (hook in `sale`, implementation merged from `account`); purchase orders default from partner in **`_create_purchase_order_record`**. Explicit `fiscal_position_id` on create still wins. No VAT-country / geo auto-detection.

**Shipped (Wave O / Phase 557):** **`res.company.account_lock_date`** — `account.move.action_post` raises if the move’s **`date`** is on or before that lock (initially first-company heuristic; **Phase 560** resolves the company from the move).

**Shipped (Phase P / 560):** **`account.move.company_id`** and **`account.journal.company_id`**. New moves default `company_id` from the journal, then from the first `res.company` row. **`action_post`** resolves **`account_lock_date`** from the move’s company when `company_id` is set; otherwise keeps the single-company fallback. Tests: `tests/test_account_move_company_phase560.py`.

**Shipped (Phase 563):** **Multi-tax `price_include` chain** — when **all** taxes on the recordset are **percent** + **price_include**, `compute_all` applies sequential strip from gross (same as single tax when one row). Tests: `tests/test_account_tax_multi_include_phase563.py`.

**Shipped (Phase 564):** **`ir.sequence.company_id`** and **`next_by_code(code, company_id=…)`** — company-specific row preferred, else global (`company_id` NULL). **`account.move`** passes **`company_id`** into `next_by_code` when generating names.

**Shipped (Phase 568):** **Mixed percent `price_include` + other taxes** — included **percent** taxes are stripped from gross first (reverse document order), then remaining taxes run on the untaxed base. Same test module as 563.

**Shipped (Phase 569):** **`ir.sequence.use_date_range`** — when enabled and a matching **`ir.sequence.date_range`** exists for **`reference_date`**, `next_by_code(..., reference_date=…)` increments the sub-row’s **`number_next`**; parent prefix/suffix/padding still apply. **`account.move`** passes **`vals["date"]`** as **`reference_date`**. Tests: `tests/test_ir_sequence_date_range_phase569.py` (mocked SQL).

**Shipped (Phase 599):** **`account.journal.currency_id`** — optional currency on the journal; on **create**, when omitted, defaults from **`res.company.currency_id`** for the journal’s **`company_id`** (or first company). Tests: `tests/test_account_journal_currency_phase599.py`.

**Shipped (Phase 605):** **`account.move.currency_id`** — on **create**, when omitted, defaults from **`account.journal.currency_id`** when **`journal_id`** is set. Tests: `tests/test_account_move_currency_from_journal_phase605.py`.

Remaining deferrals (clean-room vs `odoo-19.0/addons/account/` when prioritized):

- **Partial reconcile (no FX in v1 slice)** — **`account.reconcile.allocation`** + wizard **`allocate_amount`** (**Phase 577**); design **`docs/account_partial_reconcile_design.md`** (**572**). **FX** remains **deferred** (separate phase after stable partial-only).
- **Full multi-company lock matrix** — only per-move company + `account_lock_date` on `res.company`; no role-based “adviser” bypass yet.

Update this doc when a subtrack ships; keep matrix rows **544**, **546**, **551**, **555**, **557**, **560**, **563**, **564**, **568**, **569**, **572**, **577**, **599**, and **605** in sync.
