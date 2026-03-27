# Partial reconcile + FX — design (pre-implementation)

**Status:** Design (**Phase 572**) + **partial-only implementation** (**Phase 577**): `account.reconcile.allocation`, wizard `allocate_amount`, idempotent caps vs statement/move line residuals. **FX** and full Odoo `account.partial.reconcile` parity remain **out of scope** until a follow-on phase (**Phase 647+** — **product + design sign-off** gate; no implementation in releases **1.221.0** / **1.222.0**). Compare read-only `odoo-19.0/addons/account` when a checkout is available.

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

- **Phase 647+ (partial, 1.225.0):** when the **bank statement** and the **move line** use the **same foreign currency** (and the move line has **`amount_currency`**), the wizard converts statement-line amounts to **company currency** using that line’s **debit/credit ÷ amount_currency** rate; **`account.reconcile.allocation`** stores **`amount`** (company) plus **`amount_currency`** / **`currency_id`** for audit. **Still deferred:** `res.currency.rate` tables, cross-currency (statement currency ≠ move line currency), and automatic gain/loss moves.
- Gains/losses: optional draft `account.move` (type `entry`) tagged with `invoice_origin` like `FX-RECONCILE:…` for traceability (same pattern as `mrp_account` / Tier C stock stub) — not implemented in the 647+ slice above.

## Test plan (when implemented)

- Two open AR lines + one bank line: partial apply 40% then remainder; residuals correct.
- Multi-company: allocation blocked across companies.
- Idempotency: re-running wizard does not double-allocate.

## Sign-off checklist

- [x] Product confirms scope (partial only vs FX in v1) — **partial-only shipped**; FX deferred.
- [x] Parity matrix row + `account_odoo19_gap_audit.md` updated (**544** / **577**).
- [x] ACLs + DB-optional unittest (`tests/test_account_reconcile_allocation_phase577.py`).

## Known limitation — `statement_line.move_id`

When allocations fully cover a statement line, the wizard sets **`account.bank.statement.line.move_id`** to **one** move (derived from the first allocation). Splits across **several** `account.move` records remain auditable via **`account.reconcile.allocation`** rows; `move_id` is a convenience pointer, not a full multi-move representation. A later phase can add an explicit relation or Odoo-style parity if product requires it.

## Phase 647b — gated next slice (design only until product sign-off)

- **D1 — Rates table:** Use **`res.currency`** (or equivalent) **dated rates** for conversion instead of relying solely on the move line’s **debit/credit ÷ `amount_currency`** implied rate when currencies align.
- **D2 — Cross-currency:** Statement currency **≠** move line foreign currency; requires an explicit policy (rate date: statement vs move vs company default) and optional **gain/loss** `account.move` stub (see FX gains/losses note above).
- **Implementation rule:** No code in this slice without product scope; add behavioural tests in **`tests/test_account_reconcile_allocation_phase577.py`** (or a dedicated module) when work starts. A skipped placeholder test documents the gate.
- **Release 1.227.0:** **647b** remains **design-only** (no D1/D2 implementation); changelog notes the continued gate.
- **Release 1.228.0:** **647b** unchanged — still awaiting product scope for D1/D2.
- **Release 1.229.0:** **647b** unchanged — no code.

---

Update this file when FX or fuller parity starts; keep **Phase 544** / matrix text in sync.
