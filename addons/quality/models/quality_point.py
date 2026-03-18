"""Quality control point (Phase 230)."""

from core.orm import Model, fields


class QualityPoint(Model):
    _name = "quality.point"
    _description = "Quality Control Point"

    name = fields.Char(string="Name", required=True)
    product_id = fields.Many2one("product.product", string="Product")
    check_type = fields.Selection(
        selection=[
            ("pass_fail", "Pass/Fail"),
            ("measure", "Measure"),
        ],
        string="Check Type",
        default="pass_fail",
    )
    measure_min = fields.Float(string="Min")
    measure_max = fields.Float(string="Max")
    active = fields.Boolean(default=True)
