"""Product template (Phase 155). Base for product variants."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _name = "product.template"
    _description = "Product Template"

    name = fields.Char(required=True)
    list_price = fields.Float(string="Sales Price", default=0.0)
    categ_id = fields.Many2one("product.category", string="Category")
    attribute_line_ids = fields.One2many(
        "product.template.attribute.line",
        "template_id",
        string="Attribute Lines",
    )
