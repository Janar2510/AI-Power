"""User model - for authentication."""

from core.orm import Model, fields


class ResUsers(Model):
    _name = "res.users"
    _description = "User"

    login = fields.Char(required=True)
    password = fields.Char()
    name = fields.Char(required=True)
    active = fields.Boolean(default=True)
