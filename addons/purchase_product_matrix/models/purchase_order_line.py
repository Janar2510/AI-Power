"""Purchase line matrix payload (phase 310)."""

from core.orm import Model, fields


class PurchaseOrderLine(Model):
    _inherit = "purchase.order.line"

    purchase_product_matrix_json = fields.Text(string="Purchase Product Matrix JSON", default="")
