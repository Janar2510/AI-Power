"""Google drive URL on attachment (phase 345)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _inherit = "ir.attachment"

    google_drive_url = fields.Char(string="Google Drive URL")
