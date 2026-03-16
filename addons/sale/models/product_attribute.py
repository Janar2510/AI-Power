"""Product attributes for variants (Phase 155)."""

from core.orm import Model, fields


class ProductAttribute(Model):
    _name = "product.attribute"
    _description = "Product Attribute"

    name = fields.Char(required=True)
    value_ids = fields.One2many(
        "product.attribute.value",
        "attribute_id",
        string="Values",
    )


class ProductAttributeValue(Model):
    _name = "product.attribute.value"
    _description = "Product Attribute Value"

    name = fields.Char(required=True)
    attribute_id = fields.Many2one("product.attribute", string="Attribute", required=True, ondelete="cascade")


class ProductTemplateAttributeLine(Model):
    _name = "product.template.attribute.line"
    _description = "Product Template Attribute Line"

    template_id = fields.Many2one("product.template", string="Template", required=True, ondelete="cascade")
    attribute_id = fields.Many2one("product.attribute", string="Attribute", required=True)
    value_ids = fields.Many2many(
        "product.attribute.value",
        "product_template_attribute_line_value_rel",
        "line_id",
        "value_id",
        string="Values",
    )
