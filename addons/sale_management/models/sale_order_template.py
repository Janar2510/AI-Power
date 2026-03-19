"""Quotation template - reusable SO structure."""

from core.orm import Model, fields


class SaleOrderTemplate(Model):
    _name = "sale.order.template"
    _description = "Quotation Template"
    _order = "sequence, id"

    name = fields.Char(string="Quotation Template", required=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one("res.company", string="Company")
    sequence = fields.Integer(default=10)
    note = fields.Text(string="Terms and conditions")
    sale_order_template_line_ids = fields.One2many(
        "sale.order.template.line",
        "sale_order_template_id",
        string="Lines",
    )
