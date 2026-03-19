"""UTM Tag - categories for campaigns."""

from random import randint

from core.orm import Model, fields


class UtmTag(Model):
    """Model of categories of utm campaigns."""

    _name = "utm.tag"
    _description = "UTM Tag"
    _order = "name"

    name = fields.Char(required=True)
    color = fields.Integer(string="Color Index", default=lambda self: randint(1, 11))
