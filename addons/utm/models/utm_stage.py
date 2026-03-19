"""UTM Campaign Stage."""

from core.orm import Model, fields


class UtmStage(Model):
    """Stage for utm campaigns."""

    _name = "utm.stage"
    _description = "Campaign Stage"
    _order = "sequence"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=1)
