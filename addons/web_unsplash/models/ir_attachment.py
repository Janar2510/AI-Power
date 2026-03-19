"""Unsplash linkage on attachments (phase 319)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _inherit = "ir.attachment"

    unsplash_image_url = fields.Char(string="Unsplash Image URL", default="")
