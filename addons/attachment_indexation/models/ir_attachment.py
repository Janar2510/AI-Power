"""Attachment index content field (phase 329)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _inherit = "ir.attachment"

    index_content = fields.Text(string="Index Content")
