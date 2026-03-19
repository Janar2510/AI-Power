"""Password policy model."""

from core.orm import Model, fields


class PasswordPolicy(Model):
    _name = "password.policy"
    _description = "Password Policy"

    min_length = fields.Integer(string="Minimum Length", default=8)
    require_upper = fields.Boolean(string="Require Uppercase", default=False)
    require_digit = fields.Boolean(string="Require Digit", default=False)
    require_special = fields.Boolean(string="Require Special Character", default=False)
