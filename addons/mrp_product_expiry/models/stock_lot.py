"""Lot-level expiry reminder flag (plan field)."""

from core.orm import Model, fields


class StockLot(Model):
    _inherit = "stock.lot"

    product_expiry_reminded = fields.Boolean(string="Expiry Reminder Sent", default=False)
