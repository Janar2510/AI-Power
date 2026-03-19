"""Microsoft calendar credential model (phase 346)."""

from core.orm import Model, fields


class MicrosoftCalendarCredentials(Model):
    _name = "microsoft.calendar.credentials"
    _description = "Microsoft Calendar Credentials"

    user_id = fields.Many2one("res.users", string="User", ondelete="cascade")
    token = fields.Char(string="Token")
    refresh_token = fields.Char(string="Refresh Token")
    client_id = fields.Char(string="Client ID")
