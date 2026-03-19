"""Quotation template line."""

from core.orm import Model, fields


class SaleOrderTemplateLine(Model):
    _name = "sale.order.template.line"
    _description = "Quotation Template Line"

    sale_order_template_id = fields.Many2one(
        "sale.order.template",
        string="Template",
        required=True,
        ondelete="cascade",
    )
    product_id = fields.Many2one("product.product", string="Product")
    name = fields.Char(string="Description")
    product_uom_qty = fields.Float(string="Quantity", default=1)
    price_unit = fields.Float(string="Unit Price", default=0)
    sequence = fields.Integer(default=10)
