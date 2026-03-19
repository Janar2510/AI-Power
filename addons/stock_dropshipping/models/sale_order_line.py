"""Sale line dropshipping marker (phase 305)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    is_dropshipping = fields.Boolean(string="Is Dropshipping", default=False)
