"""POS sale margin helper field (phase 338)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    sale_margin_amount = fields.Float(string="Sale Margin Amount", default=0.0)
