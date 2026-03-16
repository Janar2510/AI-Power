"""stock.quant - Inventory quantities by location (Phase 150)."""

from core.orm import Model, fields


class StockQuant(Model):
    _name = "stock.quant"
    _description = "Quant"

    product_id = fields.Many2one("product.product", string="Product", required=True)
    location_id = fields.Many2one("stock.location", string="Location", required=True)
    lot_id = fields.Many2one("stock.lot", string="Lot/Serial", ondelete="set null")
    quantity = fields.Float(string="Quantity", default=0.0)
    reserved_quantity = fields.Float(string="Reserved", default=0.0)
