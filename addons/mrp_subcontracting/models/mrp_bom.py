"""Extend mrp.bom with subcontracting type (Phase 253)."""

from core.orm import Model, fields


class MrpBom(Model):
    _inherit = "mrp.bom"

    type = fields.Selection(
        selection=[
            ("normal", "Manufacture this product"),
            ("phantom", "Kit"),
            ("subcontracting", "Subcontracting"),
        ],
        string="BOM Type",
        default="normal",
    )
    subcontractor_ids = fields.Many2many(
        "res.partner",
        "mrp_bom_subcontractor_rel",
        "bom_id",
        "partner_id",
        string="Subcontractors",
    )
