"""repair.order (Phase 242)."""

from core.orm import Model, fields


class RepairOrder(Model):
    _name = "repair.order"
    _description = "Repair Order"

    name = fields.Char(required=True, string="Reference")
    product_id = fields.Many2one("product.product", string="Product to Repair")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        default="draft",
    )
