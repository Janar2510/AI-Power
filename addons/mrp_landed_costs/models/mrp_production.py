"""MO ↔ landed costs (plan: landed_cost_ids One2many)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    landed_cost_ids = fields.One2many(
        "stock.landed.cost",
        "mrp_production_id",
        string="Landed Costs",
    )
