"""HTTP routing helpers (phase 309)."""

from core.orm import Model


class IrHttp(Model):
    _name = "ir.http"
    _description = "HTTP Routing"

    def _slug(self, record):
        return str(record or "")

    def _unslug(self, slug):
        return slug
