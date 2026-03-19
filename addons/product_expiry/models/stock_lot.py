"""Extend stock.lot with Odoo-style expiry lifecycle fields."""

from core.orm import Model, fields


class StockLotExpiry(Model):
    _inherit = "stock.lot"

    expiration_date = fields.Datetime(string="Expiration Date")
    use_date = fields.Datetime(string="Best Before Date")
    removal_date = fields.Datetime(string="Removal Date")
    alert_date = fields.Datetime(string="Alert Date")
