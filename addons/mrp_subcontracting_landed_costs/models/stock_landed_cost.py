"""Landed costs ↔ subcontracting MOs (plan field)."""

from core.orm import Model, fields


class StockLandedCost(Model):
    _inherit = "stock.landed.cost"

    subcontracting_production_ids = fields.Many2many(
        "mrp.production",
        "stock_landed_cost_subcontracting_mrp_production_rel",
        "cost_id",
        "production_id",
        string="Subcontracting Manufacturing Orders",
    )
