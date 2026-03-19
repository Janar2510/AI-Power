"""Extend mrp.bom with purchase line links."""

from core.orm import Model, fields


class MrpBomPurchase(Model):
    _inherit = "mrp.bom"

    purchase_order_line_ids = fields.One2many(
        "purchase.order.line",
        "bom_id",
        string="Purchase Order Lines",
    )
