"""Quality check (Phase 230)."""

from core.orm import Model, fields


class QualityCheck(Model):
    _name = "quality.check"
    _description = "Quality Check"

    name = fields.Char(string="Check", required=True, default="New")
    point_id = fields.Many2one("quality.point", string="Control Point", required=True)
    picking_id = fields.Many2one("stock.picking", string="Transfer")
    product_id = fields.Many2one("product.product", string="Product")
    state = fields.Selection(
        selection=[
            ("todo", "To Do"),
            ("pass", "Passed"),
            ("fail", "Failed"),
        ],
        string="Status",
        default="todo",
    )
    measure_value = fields.Float(string="Measured Value")
