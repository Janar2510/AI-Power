"""Comparison fields on product templates (phase 316)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    comparison_attribute_ids = fields.Many2many(
        "product.attribute",
        "product_template_comparison_attr_rel",
        "template_id",
        "attribute_id",
        string="Comparison Attributes",
    )
