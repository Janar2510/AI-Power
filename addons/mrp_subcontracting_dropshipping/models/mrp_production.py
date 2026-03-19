"""Dropshipping toggle for subcontracting productions (phase 311)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    subcontract_dropship_enabled = fields.Boolean(string="Subcontract Dropship Enabled", default=False)
