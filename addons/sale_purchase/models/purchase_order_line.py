"""Extend purchase.order.line with sale_line_id for sale_purchase."""

from core.orm import Model, fields


class PurchaseOrderLineSale(Model):
    _inherit = "purchase.order.line"

    sale_line_id = fields.Many2one(
        "sale.order.line",
        string="Sale Order Line",
        copy=False,
    )
