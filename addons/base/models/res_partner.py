"""Partner (Contact) model."""

from core.orm import Model, fields


class ResPartner(Model):
    _name = "res.partner"
    _description = "Contact"

    name = fields.Char(required=True)
    email = fields.Char()
    phone = fields.Char()
    street = fields.Char()
    city = fields.Char()
    country = fields.Char()
    active = fields.Boolean(default=True)
