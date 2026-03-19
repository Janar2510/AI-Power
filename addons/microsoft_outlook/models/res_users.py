"""Outlook token on users (phase 346)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    outlook_token = fields.Char(string="Outlook Token")
