"""Google calendar credential model (phase 345)."""

from core.orm import Model, fields


class GoogleCalendarCredentials(Model):
    _name = "google.calendar.credentials"
    _description = "Google Calendar Credentials"

    user_id = fields.Many2one("res.users", string="User", ondelete="cascade")
    token = fields.Char(string="Token")
    refresh_token = fields.Char(string="Refresh Token")
    token_uri = fields.Char(string="Token URI")
