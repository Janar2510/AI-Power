"""POS MRP availability on products (phase 339)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    pos_mrp_available = fields.Boolean(string="POS MRP Available", default=False)
