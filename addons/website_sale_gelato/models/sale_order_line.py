"""Website Gelato options field (phase 328)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    website_sale_gelato_enabled = fields.Boolean(string="Website Sale Gelato Enabled", default=True)
