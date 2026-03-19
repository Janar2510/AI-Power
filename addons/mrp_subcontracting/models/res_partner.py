"""Extend res.partner with subcontractor location (Phase 253)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    property_stock_subcontractor = fields.Many2one(
        "stock.location",
        string="Subcontractor Location",
    )
