# Purchase module: Odoo 19 CE vs ERP gap audit

**Reference:** `odoo-19.0/addons/purchase/` (read-only). **ERP:** `erp-platform/addons/purchase/`.

## ERP inventory

| Area | Files |
|------|--------|
| PO / lines | `models/purchase_order.py`, `models/purchase_order_line.py` |
| Partner / picking | `models/res_partner.py`, `models/stock_picking.py` |

## Gap table (behavioural)

| Theme | Odoo-style expectation | ERP today | Direction |
|-------|------------------------|-----------|-----------|
| PO lifecycle | Draft → sent → confirmed → receipt → bill | Core transitions + stock bridge (`purchase_stock`) | Match Odoo triggers with tests |
| Requisitions | `purchase_requisition` integration | Bridge addon when enabled | Product-gated |
| Landed costs / MRP | `stock_landed_costs`, `purchase_mrp` | Bridge modules in tree | Audit per bridge |
| Fiscal positions | Tax mapping on PO | `account` fiscal hooks on purchase (see account audit) | Keep aligned with `account` |
| Security | Multi-company PO rules | ACL + record rules | Multi-company Phase D3 |

## Related tests

- `tests/` modules matching `purchase`.

## Parity matrix

See purchase-related rows in [parity_matrix.md](parity_matrix.md).
