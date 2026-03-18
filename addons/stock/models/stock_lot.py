"""stock.lot - Lot/Serial numbers (Phase 150, 198)."""

from core.orm import Model, fields


class StockLot(Model):
    _name = "stock.lot"
    _description = "Lot/Serial"

    name = fields.Char(string="Lot/Serial Number", required=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    company_id = fields.Many2one("res.company", string="Company")
    expiry_date = fields.Date(string="Expiry Date")  # Phase 198
