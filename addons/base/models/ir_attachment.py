"""ir.attachment - File attachments linked to records (res_model, res_id). Phase 212: mimetype, file_size, checksum."""

import base64
import hashlib
from core.orm import Model, fields


class IrAttachment(Model):
    _name = "ir.attachment"
    _description = "Attachment"

    name = fields.Char(required=True, string="File name")
    res_model = fields.Char(string="Related Model")
    res_id = fields.Integer(string="Related Record ID")
    datas = fields.Binary(string="File content")
    mimetype = fields.Char(string="MIME type")
    file_size = fields.Integer(string="File size")
    checksum = fields.Char(string="Checksum")

    @classmethod
    def create(cls, vals):
        """Phase 212: Compute mimetype, file_size, checksum from datas on create."""
        datas = vals.get("datas")
        if datas:
            raw = datas
            if isinstance(datas, str):
                try:
                    raw = base64.b64decode(datas)
                except Exception:
                    raw = b""
            if isinstance(raw, bytes) and raw:
                vals = dict(vals)
                vals["file_size"] = len(raw)
                vals["checksum"] = hashlib.sha256(raw).hexdigest()
                if not vals.get("mimetype"):
                    import mimetypes
                    name = vals.get("name", "")
                    mt, _ = mimetypes.guess_type(name)
                    vals["mimetype"] = mt or "application/octet-stream"
        return super().create(vals)
