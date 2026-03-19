"""Extend product.product with margin helper fields."""

from core.orm import Model, api, fields


class ProductProductMargin(Model):
    _inherit = "product.product"

    total_margin = fields.Float(
        string="Total Margin",
        compute="_compute_margin_fields",
    )
    expected_margin_rate = fields.Float(
        string="Expected Margin Rate",
        compute="_compute_margin_fields",
    )

    @api.depends("product_template_id.list_price", "product_template_id.standard_price")
    def _compute_margin_fields(self):
        for product in self:
            template = product.product_template_id
            sale_price = (template.list_price if template else 0.0) or 0.0
            cost_price = (template.standard_price if template else 0.0) or 0.0
            product.total_margin = sale_price - cost_price
            product.expected_margin_rate = (product.total_margin / sale_price) if sale_price else 0.0
