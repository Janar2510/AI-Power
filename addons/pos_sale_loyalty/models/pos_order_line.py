"""POS sale loyalty helper field (phase 337)."""

from core.orm import Model, fields


class PosOrderLine(Model):
    _inherit = "pos.order.line"

    sale_loyalty_applied = fields.Boolean(string="Sale Loyalty Applied", default=False)
