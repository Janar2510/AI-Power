# MRP module: Odoo 19 CE vs ERP gap audit

**Reference:** `odoo-19.0/addons/mrp/` (read-only). **ERP:** `erp-platform/addons/mrp/`.

## ERP inventory

| Area | Files |
|------|--------|
| Manufacturing | `models/mrp_production.py`, `models/mrp_workorder.py` |
| BOM / routing ops | `models/mrp_bom.py`, `models/mrp_bom_operation.py` |
| Work centers | `models/mrp_workcenter.py` |
| Stock / product | `models/stock_move.py`, `models/stock_location.py`, `models/product_template.py` |

## Gap table (behavioural)

| Theme | Odoo-style expectation | ERP today | Direction |
|-------|------------------------|-----------|-----------|
| MO state machine | draft → confirmed → progress → done; backorders | Core states + qty semantics | Compare `mrp_production` methods to upstream (read-only) |
| Work orders | Shop floor, duration, qty producing | `mrp_workorder` subset | Expand with tests |
| BOM types | Normal / phantom / subcontract flags | ERP BOM lines + operations | `mrp_subcontracting*` bridges |
| Costing | `mrp_account`, landed costs | Bridge modules | See `stock_odoo19_gap_audit.md` / account |
| Planning | Gantt / planning hooks | Web client gantt view partial | [odoo19-webclient-gap-table.md](odoo19-webclient-gap-table.md) |

## Related tests

- `tests/` for `mrp_`, manufacturing flows.

## Parity matrix

See MRP rows in [parity_matrix.md](parity_matrix.md).
