"""Product supplier info (Phase 247)."""

from core.orm import Model, fields


class ProductSupplierinfo(Model):
    _name = "product.supplierinfo"
    _description = "Supplier Pricelist"

    partner_id = fields.Many2one("res.partner", string="Vendor", required=True, ondelete="cascade")
    product_tmpl_id = fields.Many2one("product.template", string="Product Template", required=True, ondelete="cascade")
    price = fields.Float(string="Unit Price", default=0.0)
    min_qty = fields.Float(string="Min. Quantity", default=0.0)
