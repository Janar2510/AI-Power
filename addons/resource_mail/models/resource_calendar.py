"""Resource calendar chatter bridge (phase 303)."""

from core.orm import Model, fields


class ResourceCalendar(Model):
    _inherit = "resource.calendar"

    message_ids = fields.One2many("mail.message", "res_id", string="Messages")
