"""Call sale margin refresh from stock.move updates."""

from core.orm import Model, fields
from core.orm.models import ModelBase


class StockMoveSaleMargin(Model):
    _inherit = "stock.move"

    sale_line_id = fields.Many2one("sale.order.line", string="Sale Order Line", copy=False)

    def write(self, vals):
        res = ModelBase.write(self, vals)
        if vals.get("state") == "done":
            for move in self:
                if move.sale_line_id and hasattr(move.sale_line_id, "_update_purchase_price_from_stock_move"):
                    move.sale_line_id._update_purchase_price_from_stock_move(move)
        return res
