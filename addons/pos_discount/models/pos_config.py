"""POS discount fields (phase 337)."""

from core.orm import Model, fields


class PosConfig(Model):
    _inherit = "pos.config"

    discount_product_id = fields.Many2one("product.product", string="Discount Product", ondelete="set null")
    discount_pc = fields.Float(string="Discount %", default=0.0)
