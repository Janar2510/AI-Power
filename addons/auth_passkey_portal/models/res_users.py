"""Portal passkey enablement on users (phase 312)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    passkey_portal_enabled = fields.Boolean(string="Portal Passkey Enabled", default=True)
