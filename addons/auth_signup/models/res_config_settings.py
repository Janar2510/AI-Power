"""res.config.settings auth_signup. Phase 256."""

from core.orm import Model, fields


class ResConfigSettingsAuthSignup(Model):
    _inherit = "res.config.settings"

    auth_signup_reset_password = fields.Boolean(
        string="Enable password reset from Login page",
        config_parameter="auth_signup.reset_password",
        default=True,
    )
    auth_signup_uninvited = fields.Selection(
        selection=[
            ("b2b", "On invitation"),
            ("b2c", "Free sign up"),
        ],
        string="Customer Account",
        default="b2c",
        config_parameter="auth_signup.invitation_scope",
    )
