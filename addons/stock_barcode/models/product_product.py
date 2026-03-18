"""Extend product.product with barcode (Phase 229)."""

from core.orm import Model, fields


class ProductProduct(Model):
    _inherit = "product.product"

    barcode = fields.Char(string="Barcode")
