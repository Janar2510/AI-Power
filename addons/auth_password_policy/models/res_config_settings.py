"""Password policy settings stored in ir.config_parameter."""

from core.orm import Model, fields


class ResConfigSettingsPasswordPolicy(Model):
    _inherit = "res.config.settings"

    password_min_length = fields.Integer(
        string="Minimum Password Length",
        default=8,
        config_parameter="auth_password_policy.min_length",
    )
    password_require_upper = fields.Boolean(
        string="Require Uppercase",
        default=False,
        config_parameter="auth_password_policy.require_upper",
    )
    password_require_digit = fields.Boolean(
        string="Require Digit",
        default=False,
        config_parameter="auth_password_policy.require_digit",
    )
    password_require_special = fields.Boolean(
        string="Require Special Character",
        default=False,
        config_parameter="auth_password_policy.require_special",
    )
