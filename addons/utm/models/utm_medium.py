"""UTM Medium - delivery method (email, banner, etc.)."""

from core.orm import Model, fields


class UtmMedium(Model):
    _name = "utm.medium"
    _description = "UTM Medium"
    _order = "name"

    name = fields.Char(string="Medium Name", required=True)
    active = fields.Boolean(default=True)
