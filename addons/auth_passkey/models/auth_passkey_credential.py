"""Passkey credential model (phase 312)."""

from core.orm import Model, fields


class AuthPasskeyCredential(Model):
    _name = "auth.passkey.credential"
    _description = "Passkey Credential"

    user_id = fields.Many2one("res.users", string="User", ondelete="cascade")
    credential_id = fields.Char(string="Credential ID", required=True)
    public_key = fields.Text(string="Public Key")
    name = fields.Char(string="Name", default="")
