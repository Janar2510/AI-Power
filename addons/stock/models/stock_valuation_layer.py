"""Stock valuation layer (Phase 173)."""

from datetime import datetime

from core.orm import Model, fields


class StockValuationLayer(Model):
    _name = "stock.valuation.layer"
    _description = "Stock Valuation Layer"

    product_id = fields.Many2one("product.product", string="Product", required=True)
    quantity = fields.Float(string="Quantity", default=0.0)
    unit_cost = fields.Float(string="Unit Cost", default=0.0)
    value = fields.Float(string="Value", default=0.0)
    stock_move_id = fields.Many2one("stock.move", string="Stock Move", ondelete="set null")
    description = fields.Char(string="Description")
    create_date = fields.Datetime(string="Created", default=lambda: datetime.utcnow().isoformat())
