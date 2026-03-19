"""UoM Category (Phase 237)."""

from core.orm import Model, fields


class UomCategory(Model):
    _name = "uom.category"
    _description = "Unit of Measure Category"

    name = fields.Char(required=True, string="Category")
