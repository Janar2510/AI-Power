"""UoM Unit of Measure (Phase 237)."""

from core.orm import Model, fields


class UomUom(Model):
    _name = "uom.uom"
    _description = "Unit of Measure"

    name = fields.Char(required=True, string="Unit")
    category_id = fields.Many2one("uom.category", string="Category", required=True, ondelete="cascade")
    factor = fields.Float(string="Ratio", default=1.0)  # 1 unit = factor * reference
    factor_inv = fields.Float(string="Bigger Ratio", default=1.0)  # reference = factor_inv * this
    rounding = fields.Float(string="Rounding Precision", default=0.01)

    def _compute_quantity(self, qty: float, to_unit) -> float:
        """Convert qty from self to to_unit."""
        if self.id == to_unit.id:
            return qty
        # qty in self -> convert to reference (category) -> convert to to_unit
        from_ref = qty / (self.factor or 1.0)
        to_val = from_ref * (to_unit.factor or 1.0)
        return to_val
