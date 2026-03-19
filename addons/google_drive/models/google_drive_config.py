"""Google drive config model (phase 345)."""

from core.orm import Model, fields


class GoogleDriveConfig(Model):
    _name = "google.drive.config"
    _description = "Google Drive Config"

    name = fields.Char(string="Name", default="")
    model_id = fields.Many2one("ir.model", string="Model", ondelete="set null")
    google_drive_template_url = fields.Char(string="Google Drive Template URL")
    active = fields.Boolean(string="Active", default=True)
