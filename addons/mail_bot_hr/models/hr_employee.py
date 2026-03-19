"""Employee mail-bot channel (Phase 307)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    mail_bot_hr_channel = fields.Char(string="Mail Bot Channel", default="")
