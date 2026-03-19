"""Sale line lot expiration bridge (phase 302)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    lot_expiration_date = fields.Datetime(string="Lot Expiration Date")
    sale_stock_expiry_risk = fields.Selection(
        selection=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        string="Stock Expiry Risk",
        default="low",
    )
