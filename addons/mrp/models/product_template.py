"""MRP flags on product (manufacture on order / MTO-style)."""

from core.orm import Model, fields


class ProductTemplateMrp(Model):
    _inherit = "product.template"

    manufacture_on_order = fields.Boolean(
        string="Manufacture on Order",
        default=False,
        help="When set, confirming a sales order line creates a manufacturing order for this product (requires a normal BOM).",
    )
