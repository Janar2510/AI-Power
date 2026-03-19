"""Website stock display field (phase 316)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    website_stock_display = fields.Selection(
        selection=[("always", "Always"), ("threshold", "Threshold")],
        string="Website Stock Display",
        default="always",
    )
