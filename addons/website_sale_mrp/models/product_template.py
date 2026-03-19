"""Website BOM availability field (phase 325)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    website_bom_available = fields.Boolean(string="Website BOM Available", default=False)
