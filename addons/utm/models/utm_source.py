"""UTM Source - link source (search engine, referral, etc.)."""

from core.orm import Model, fields


class UtmSource(Model):
    _name = "utm.source"
    _description = "UTM Source"

    name = fields.Char(string="Source Name", required=True)
