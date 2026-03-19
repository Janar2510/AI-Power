"""POS restaurant loyalty helper field (phase 339)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    restaurant_loyalty_applied = fields.Boolean(string="Restaurant Loyalty Applied", default=False)
