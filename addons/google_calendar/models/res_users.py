"""Google calendar user fields (phase 345)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    google_calendar_token = fields.Char(string="Google Calendar Token")
    google_calendar_sync = fields.Boolean(string="Google Calendar Sync", default=False)
