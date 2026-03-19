"""Cloud storage provider model (phase 349)."""

from core.orm import Model, fields


class CloudStorageProvider(Model):
    _name = "cloud.storage.provider"
    _description = "Cloud Storage Provider"

    name = fields.Char(string="Name", default="")
    provider_type = fields.Selection(
        [("s3", "S3"), ("gcs", "GCS"), ("azure", "Azure")],
        string="Provider Type",
        default="s3",
    )
    bucket_name = fields.Char(string="Bucket Name")
    access_key = fields.Char(string="Access Key")
    secret_key = fields.Char(string="Secret Key")
