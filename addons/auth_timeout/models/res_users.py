"""Session timeout field on users (phase 312)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    session_timeout = fields.Integer(string="Session Timeout (minutes)", default=60)
