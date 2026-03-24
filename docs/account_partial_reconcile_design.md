# Partial reconcile + FX — design (pre-implementation)

**Status:** Design-only (**Phase 572**). No production code beyond this document until product sign-off. Compare read-only `odoo-19.0/addons/account` reconciliation / `account.partial.reconcile` behaviour when a checkout is available.

## Goals

- Support **partial allocation** of a bank statement line (or payment) across multiple `account.move.line` rows without forcing full line closure.
- Preserve **auditability**: each allocation should be traceable (amount, currency, date, user).
- Define how **multi-currency** and **FX differences** are surfaced (separate gain/loss move vs embedded in match) before coding.

## ERP baseline (today)

- `account.bank.statement` + wizard flows link lines to moves; `_auto_reconcile` and `reconciled_id` string-style links cover a **subset** of Odoo’s matcher behaviour.
- No first-class `account.partial.reconcile` model parity; no automatic FX revaluation on match.

## Proposed target shape (options)

| Approach | Pros | Cons |
|----------|------|------|
| **A — Partial link table** | Clear many-to-many with residual amounts; mirrors Odoo conceptually | New models, migration, UI work |
| **B — Residual fields on lines** | Smaller schema | Harder to audit partial history |
| **C — Stub + journal entry** | Reuses `account.move` | Duplicates logic between “economic” and “matching” events |

**Recommendation for a first slice:** **A**, minimal: `account.reconcile.allocation` (working name) with `statement_line_id`, `move_line_id`, `amount`, `amount_currency`, `company_id`, `create_date`; enforce `company_id` alignment with Phase 560.

## FX

- **Deferred** in the first slice unless product mandates: document whether rates come from move date, statement date, or company default.
- Gains/losses: optional draft `account.move` (type `entry`) tagged with `invoice_origin` like `FX-RECONCILE:…` for traceability (same pattern as `mrp_account` / Tier C stock stub).

## Test plan (when implemented)

- Two open AR lines + one bank line: partial apply 40% then remainder; residuals correct.
- Multi-company: allocation blocked across companies.
- Idempotency: re-running wizard does not double-allocate.

## Sign-off checklist

- [ ] Product confirms scope (partial only vs FX in v1).
- [ ] Parity matrix row + `account_odoo19_gap_audit.md` updated.
- [ ] DB migration + ACLs + at least one DB-optional unittest.

Update this file when implementation starts; keep **Phase 544** / matrix text in sync.
