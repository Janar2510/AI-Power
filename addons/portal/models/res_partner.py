"""Extend res.partner with portal access URL (Phase 239)."""

from core.orm import Model, fields


class ResPartnerPortal(Model):
    _name = "res.partner"
    _inherit = "res.partner"

    access_url = fields.Computed(compute="_compute_access_url", string="Portal URL")

    def _compute_access_url(self):
        """Compute portal access URL for sharing."""
        rows = self.read(["id"])
        base = "/my/partner/"
        return [f"{base}{r.get('id', 0)}" for r in rows]
