"""Portal TOTP setup bridge (phase 304)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    totp_portal_setup_required = fields.Boolean(
        string="Portal TOTP Setup Required",
        default=False,
    )
    totp_portal_enabled = fields.Boolean(string="Portal TOTP Enabled", default=True)
