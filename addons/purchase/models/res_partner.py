"""Extend res.partner with supplier_rank (Phase 117)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    supplier_rank = fields.Integer(string="Vendor Rank", default=0)
