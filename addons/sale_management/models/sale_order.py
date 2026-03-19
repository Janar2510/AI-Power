"""Extend sale.order with template_id."""

from core.orm import Model, fields


class SaleOrderTemplateExt(Model):
    _inherit = "sale.order"

    sale_order_template_id = fields.Many2one(
        "sale.order.template",
        string="Quotation Template",
    )
