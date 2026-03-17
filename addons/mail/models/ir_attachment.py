"""Extend ir.attachment with mail_message_id for chatter (Phase 184)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _inherit = "ir.attachment"

    mail_message_id = fields.Many2one("mail.message", string="Message", ondelete="cascade")
