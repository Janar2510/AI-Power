"""POS restaurant Adyen marker field (phase 344)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    restaurant_adyen_enabled = fields.Boolean(string="Restaurant Adyen Enabled", default=True)
