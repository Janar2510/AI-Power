# Stock + stock_account: Odoo 19 CE vs ERP gap audit (Wave G)

**Reference:** read-only `odoo-19.0/addons/stock/`, `odoo-19.0/addons/stock_account/` vs [erp-platform/addons/stock/](addons/stock/) and [addons/stock_account/](addons/stock_account/). Clean-room rules: [docs/ai-rules.md](ai-rules.md).

## ERP surface today

| Module | Role |
|--------|------|
| `stock` | `stock.picking`, `stock.move`, `stock.quant`, reservation, partial qty (Phase 530), validate lifecycle (Phase 525) |
| `stock_account` | `stock.picking` inherit: `valuation_state` pending→posted on validate; `action_post_valuation` helper |

## Odoo 19 `stock_account` (behavioural breadth)

Upstream adds valuation on **moves** (`value`, `account_move_id`, anglo-saxon / real-time / periodic), **stock.valuation.layer**, lot valuation, multi-company, and reporting. ERP implements **layers** with **FIFO remaining consumption** on outgoing (Phase **570**) and an **optional** draft **`account.move`** stub when **`res.company.stock_valuation_auto_account_move`** is set (Phase **571**); not full Odoo `_run_valuation` / anglo-saxon parity.

## Gap table

| Theme | Odoo-style | ERP today | Direction |
|-------|------------|-----------|-----------|
| Valuation layers | FIFO/AVCO layers, `_run_valuation` | `stock.valuation.layer` + `remaining_*`; outgoing consumes prior layers **FIFO** (Phase **570**); no full Odoo runner | AVCO policy refinement deferred |
| Account entries from stock | Real-time posting on done moves | Optional Tier **571** draft `account.move` (company flag); `stock_account` still no mandatory posting | MRP cost stub uses `account.move` separately |
| Picking valuation flag | N/A as single field | `valuation_state` marks transfer “valued” for integrations | Keep; document as **subset** (Phase 539) |
| Quant value | Valued quants, ownership exclusions | Quantity-focused quants | Align later if product needs COGS |

## Tests

- Phases 539–541 (single DB bootstrap): `tests/test_phases_539_541_stock_mrp_sale_db.py` or `./scripts/run_phases_539_541_db.sh` (Phase 545: test 540 creates expense + current-asset accounts if the chart has none)
- Stock picking quant behaviour: `tests/test_stock_picking_phase525.py`, `tests/test_stock_partial_reserve_phase530.py`
- Valuation layers on done moves: Phase 173 (`stock_move_quant._create_valuation_layers`); model `stock.valuation.layer` — not part of Wave M scope (546 Option B was satisfied by existing Phase 173)

## Planned depth (design doc)

Tiered plan + shipped Tier B/C subset: [docs/stock_valuation_layers_scope.md](stock_valuation_layers_scope.md).

## Parity matrix

See **Phase 539** in [docs/parity_matrix.md](parity_matrix.md).
