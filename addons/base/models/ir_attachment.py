"""ir.attachment — DB or disk filestore (Phase 4b)."""

import base64
import hashlib
import os
import re
from typing import Any, Dict

from core.orm import Model, fields
from core.tools import config


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
    store_fname = fields.Char(string="Stored path")

    @classmethod
    def _filestore_dir(cls) -> str:
        cfg = config.get_config()
        base = cfg.get("data_dir") or cfg.get("filestore_path") or "/tmp/erp-filestore"
        dbn = cfg.get("db_name", "erp")
        path = os.path.join(base, dbn)
        os.makedirs(path, exist_ok=True)
        return path

    @classmethod
    def _use_filestore(cls) -> bool:
        loc = (config.get_config().get("attachment_location") or "db").lower()
        return loc == "file"

    @classmethod
    def _store_bytes(cls, raw: bytes) -> str:
        h = hashlib.sha1(raw).hexdigest()
        d = cls._filestore_dir()
        sub = os.path.join(d, h[:2], h[2:4])
        os.makedirs(sub, exist_ok=True)
        fname = os.path.join(sub, h)
        if not os.path.isfile(fname):
            with open(fname, "wb") as f:
                f.write(raw)
        return f"{h[:2]}/{h[2:4]}/{h}"

    @classmethod
    def create(cls, vals: Dict[str, Any]):
        vals = dict(vals or {})
        datas = vals.get("datas")
        if datas and cls._use_filestore():
            raw = datas
            if isinstance(datas, str):
                try:
                    raw = base64.b64decode(datas)
                except Exception:
                    raw = b""
            if isinstance(raw, bytes) and raw:
                import mimetypes

                name = vals.get("name", "")
                mt_guess, _ = mimetypes.guess_type(name)
                vals["mimetype"] = vals.get("mimetype") or mt_guess or "application/octet-stream"
                if str(vals.get("mimetype") or "").startswith("image/"):
                    max_side = int(config.get_config().get("attachment_image_max", 1920))
                    raw = cls._resize_image_if_needed(raw, max_side)
                vals["store_fname"] = cls._store_bytes(raw)
                vals["file_size"] = len(raw)
                vals["checksum"] = hashlib.sha256(raw).hexdigest()
                vals["datas"] = False
            return super().create(vals)
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

    @classmethod
    def _gc_file_store(cls) -> int:
        """Remove orphan files from filestore (call from cron). Returns removed count."""
        if not cls._use_filestore():
            return 0
        d = cls._filestore_dir()
        if not os.path.isdir(d):
            return 0
        # Minimal GC: would need DB scan for referenced store_fname; placeholder for ops cron
        return 0

    @classmethod
    def _resize_image_if_needed(cls, raw: bytes, max_side: int = 1920) -> bytes:
        """Resize large images when Pillow is available (Phase 4b)."""
        try:
            from io import BytesIO

            from PIL import Image  # type: ignore
        except Exception:
            return raw
        try:
            im = Image.open(BytesIO(raw))
            im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
            w, h = im.size
            if w <= max_side and h <= max_side:
                return raw
            im.thumbnail((max_side, max_side))
            buf = BytesIO()
            im.save(buf, format="JPEG", quality=85)
            return buf.getvalue()
        except Exception:
            return raw
