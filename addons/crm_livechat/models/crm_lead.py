"""Livechat link field on CRM lead (phase 332)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    livechat_channel_id = fields.Many2one("im_livechat.channel", string="Livechat Channel", ondelete="set null")
