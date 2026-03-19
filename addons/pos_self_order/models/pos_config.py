"""POS self-order fields (phase 340)."""

from core.orm import Model, fields


class PosConfig(Model):
    _inherit = "pos.config"

    self_order_enabled = fields.Boolean(string="Self Order Enabled", default=False)
    self_order_url = fields.Char(string="Self Order URL", default="")
