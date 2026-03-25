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
    remaining_qty = fields.Float(
        string="Remaining Quantity",
        default=0.0,
        help="Phase 565 Tier A: FIFO consumption hook; initial copy of quantity.",
    )
    remaining_value = fields.Float(
        string="Remaining Value",
        default=0.0,
        help="Phase 565 Tier A: initial copy of value for layer consumption tracking.",
    )
    stock_move_id = fields.Many2one("stock.move", string="Stock Move", ondelete="set null")
    lot_id = fields.Many2one(
        "stock.lot",
        string="Lot/Serial",
        ondelete="set null",
        help="Phase 579: FIFO consumption can match lot-specific layers.",
    )
    description = fields.Char(string="Description")
    create_date = fields.Datetime(string="Created", default=lambda: datetime.utcnow().isoformat())
