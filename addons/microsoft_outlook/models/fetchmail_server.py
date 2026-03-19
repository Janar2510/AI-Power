"""Outlook fields on fetchmail server (phase 346)."""

from core.orm import Model, fields


class FetchmailServer(Model):
    _inherit = "fetchmail.server"

    outlook_client_id = fields.Char(string="Outlook Client ID")
    outlook_client_secret = fields.Char(string="Outlook Client Secret")
