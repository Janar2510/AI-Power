"""res.country - Country (minimal for Phase 32)."""

from core.orm import Model, fields


class ResCountry(Model):
    _name = "res.country"
    _description = "Country"

    name = fields.Char(required=True, string="Country Name")
    code = fields.Char(string="Country Code", size=2, required=True)
    state_ids = fields.One2many("res.country.state", "country_id", string="States")
