"""Sale line matrix payload (phase 310)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    sale_product_matrix_json = fields.Text(string="Sale Product Matrix JSON", default="")
