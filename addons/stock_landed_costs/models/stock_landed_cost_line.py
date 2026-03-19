"""Stock landed cost lines."""

from core.orm import Model, fields


class StockLandedCostLine(Model):
    _name = "stock.landed.cost.line"
    _description = "Stock Landed Cost Line"

    cost_id = fields.Many2one("stock.landed.cost", string="Landed Cost", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product")
    name = fields.Char(string="Description")
    account_id = fields.Many2one("account.account", string="Account")
    price_unit = fields.Float(string="Cost", default=0.0)
    split_method = fields.Selection(
        selection=[
            ("equal", "Equal"),
            ("by_quantity", "By Quantity"),
            ("by_current_cost_price", "By Current Cost"),
            ("by_weight", "By Weight"),
            ("by_volume", "By Volume"),
        ],
        default="equal",
        string="Split Method",
    )
