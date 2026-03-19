"""Microsoft calendar user fields (phase 346)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    microsoft_calendar_token = fields.Char(string="Microsoft Calendar Token")
    microsoft_calendar_sync = fields.Boolean(string="Microsoft Calendar Sync", default=False)
