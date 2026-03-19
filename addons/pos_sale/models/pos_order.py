"""POS linkage to sale orders (phase 337)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    sale_order_id = fields.Many2one("sale.order", string="Sale Order", ondelete="set null")
