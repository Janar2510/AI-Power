"""Product variant (Phase 247). Inherits from product.template."""

from core.orm import Model, fields


class ProductProduct(Model):
    _name = "product.product"
    _description = "Product Variant"
    _inherits = {"product.template": "product_template_id"}

    product_template_id = fields.Many2one("product.template", string="Template", required=True, ondelete="cascade")
    default_code = fields.Char(string="Internal Reference")
    barcode = fields.Char(string="Barcode")
    attribute_value_ids = fields.Many2many(
        "product.attribute.value",
        "product_product_attribute_value_rel",
        "product_id",
        "value_id",
        string="Variant Values",
    )
    active = fields.Boolean(default=True)
