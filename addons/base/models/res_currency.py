"""res.currency - Currency (for res.company and localization stub)."""

from core.orm import Model, fields


class ResCurrency(Model):
    _name = "res.currency"
    _description = "Currency"

    name = fields.Char(required=True, string="Currency Code", size=3)
    symbol = fields.Char(required=True, string="Symbol")
    rate = fields.Float(string="Rate", default=1.0)
