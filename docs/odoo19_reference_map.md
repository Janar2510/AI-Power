# Odoo 19.0 local reference map (Phase 525+)

Use this when comparing behaviour to upstream **Odoo 19 CE**. Implement **clean-room** in `erp-platform` per [docs/ai-rules.md](ai-rules.md). **Planning:** follow **Reference analysis (required for planning)** in `ai-rules.md` before backend or web changes.

## Expected layout

| Path | Role |
|------|------|
| `../odoo-19.0/` or `AI Power/odoo-19.0/` | Sibling of `erp-platform/` (not committed here) |
| `odoo-19.0/odoo/` | Framework (ORM, HTTP) — compare to `erp-platform/core/` |
| `odoo-19.0/addons/<module>/` | Apps — compare to `erp-platform/addons/<module>/` |

If `odoo-19.0` is missing locally, clone Odoo 19 CE into `AI Power/odoo-19.0` and add the folder to your Cursor workspace alongside `erp-platform`.

## High-priority addon mapping

| Domain | Odoo 19 path | ERP platform path |
|--------|--------------|-------------------|
| Stock core | `addons/stock/models/stock_picking.py`, `stock_move.py`, `stock_quant.py` | `addons/stock/models/` |
| Stock valuation | `addons/stock_account/` | `addons/stock_account/`; gap notes [docs/stock_odoo19_gap_audit.md](stock_odoo19_gap_audit.md) |
| MRP | `addons/mrp/models/mrp_production.py`, `mrp_workorder.py`, `mrp_bom.py` | `addons/mrp/models/` |
| MRP costing | `addons/mrp_account/` | `addons/mrp_account/` |
| Web assets | `addons/web/__manifest__.py`, static pipeline | `addons/web/`, `core/modules/assets.py` |

## Workflow

1. Identify trigger and state transitions in Odoo (read-only).
2. Record expected behaviour in a test or comment.
3. Implement equivalent logic in ERP without copying source code.
