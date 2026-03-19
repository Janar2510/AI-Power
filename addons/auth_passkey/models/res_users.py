"""Passkey relations on users (phase 312)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    passkey_credential_ids = fields.One2many("auth.passkey.credential", "user_id", string="Passkeys")
