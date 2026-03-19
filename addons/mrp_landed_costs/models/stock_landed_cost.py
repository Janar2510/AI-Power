"""Extend landed costs for manufacturing orders (Odoo mrp_landed_costs parity)."""

from core.orm import Model, fields


class StockLandedCost(Model):
    _inherit = "stock.landed.cost"

    target_model = fields.Selection(
        selection=[
            ("picking", "Transfers"),
            ("manufacturing", "Manufacturing Orders"),
        ],
        string="Apply On",
        default="picking",
    )
    mrp_production_ids = fields.Many2many(
        "mrp.production",
        "stock_landed_cost_mrp_production_rel",
        "cost_id",
        "production_id",
        string="Manufacturing Orders",
    )
    mrp_production_id = fields.Many2one(
        "mrp.production",
        string="Primary Manufacturing Order",
        ondelete="set null",
    )

    def _get_targeted_move_ids(self):
        """Return move ids for valuation split (stub: empty set semantics)."""
        return []
