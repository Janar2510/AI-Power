# Stock valuation layers — scope design (pre-code)

**Status:** **Tier A (565)** + **Tier B FIFO consumption (570)** + **Tier C stub (571)** — outgoing moves consume positive layers’ `remaining_*` in **FIFO** order (`id`); shortfall uses product `standard_price`. **`res.company.stock_valuation_auto_account_move`** (on `res.company`, base module): when **True** and `account` is installed, a best-effort balanced draft **`account.move`** may be created (expense / `asset_current`), idempotent by `invoice_origin` `STK-COGS:…`.

**References:** Read-only `odoo-19.0/addons/stock_account/` (workspace sibling of `erp-platform/`) vs ERP `erp-platform/addons/stock_account/` and [stock_odoo19_gap_audit.md](stock_odoo19_gap_audit.md).

## Goal

Define a **minimal Odoo-aligned subset** for inventory valuation so ERP can evolve from today’s `valuation_state` flag on `stock.picking` toward move-level economics without committing to full CE parity in one step.

## ERP today (baseline)

- `stock`: quants, moves, partial reservation, picking validate lifecycle.
- `stock_account`: `valuation_state` on pickings; **`stock.valuation.layer`** on done moves (stock module); optional Tier C draft moves when company flag is set (Phase **571**).
- Manufacturing cost uses separate `mrp_account` draft `account.move` stubs (see gap audit).

## Proposed scope tiers

### Tier A — Model + audit trail (no automatic accounting)

- Introduce or formalise **`stock.valuation.layer`**-like records: link to `stock.move`, product, quantity, **unit_cost**, **value**, optional `remaining_qty` / `remaining_value` for FIFO layers.
- **No** required posting to `account.move` in Tier A.
- Hooks: create/update layers when moves reach `done` (incoming/outgoing policy TBD).

### Tier B — Valuation method (product-level)

- Support **FIFO** or **average cost** (pick one first; Odoo supports more).
- Document invariants: layer consumption on outgoing, negative stock handling (deferred or explicit error).

### Tier C — `account.move` bridge (anglo-saxon / real-time subset)

- Optional automatic journal entries on valuation events (delivery, receipt), gated by company/product category settings.
- Depends on **`account.move.company_id`** and chart alignment (Phase 560+).

## Explicit non-goals (initial waves)

- Full **landed cost** allocation stack (see `stock_landed_costs` bridge already scaffolded).
- **Multi-currency** FX on valuation layers.
- Parity with every `stock_account` report in Odoo CE.

## Testing strategy

- Unit tests with small move graphs (similar cost to [tests/test_phases_539_541_stock_mrp_sale_db.py](tests/test_phases_539_541_stock_mrp_sale_db.py)).
- Separate tests for layer math vs optional account posting once Tier C starts.

## Decision log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sequencing | Tier A → B → C | Accounting bridge needs stable company + accounts |
| Clean-room | Behavioural parity only | `ai-rules.md` — no verbatim Odoo copy |

Update this document when a tier is implemented; keep [docs/stock_odoo19_gap_audit.md](stock_odoo19_gap_audit.md) and [docs/parity_matrix.md](parity_matrix.md) in sync.
