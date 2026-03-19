"""Livechat channel field on HR employees (phase 333)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    livechat_channel_id = fields.Many2one("im_livechat.channel", string="Livechat Channel", ondelete="set null")
