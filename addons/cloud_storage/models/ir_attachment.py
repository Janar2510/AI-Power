"""Cloud storage fields on attachments (phase 349)."""

from core.orm import Model, fields


class IrAttachment(Model):
    _inherit = "ir.attachment"

    cloud_storage_url = fields.Char(string="Cloud Storage URL")
    cloud_provider_id = fields.Many2one("cloud.storage.provider", string="Cloud Provider", ondelete="set null")
