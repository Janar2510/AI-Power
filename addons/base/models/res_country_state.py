"""res.country.state - State/Province (Odoo 19 parity)."""

from core.orm import Model, fields


class ResCountryState(Model):
    _name = "res.country.state"
    _description = "Country State"

    name = fields.Char(required=True, string="State Name")
    code = fields.Char(string="State Code", size=3)
    country_id = fields.Many2one("res.country", string="Country", required=True)
