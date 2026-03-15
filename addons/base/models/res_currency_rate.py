"""res.currency.rate - Currency exchange rates (Phase 96)."""

from core.orm import Model, fields


class ResCurrencyRate(Model):
    _name = "res.currency.rate"
    _description = "Currency Rate"

    currency_id = fields.Many2one("res.currency", required=True, string="Currency")
    name = fields.Date(required=True, string="Date")
    rate = fields.Float(string="Rate", default=1.0)
