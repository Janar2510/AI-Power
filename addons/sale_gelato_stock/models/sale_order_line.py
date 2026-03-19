"""Gelato stock fulfillment field (phase 328)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    gelato_fulfilled = fields.Boolean(string="Gelato Fulfilled", default=False)
