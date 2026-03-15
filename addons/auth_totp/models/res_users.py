"""Extend res.users with TOTP two-factor authentication (Phase 125)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    totp_secret = fields.Char(string="TOTP Secret")  # base32 secret for pyotp
    totp_enabled = fields.Boolean(string="TOTP Enabled", default=False)
