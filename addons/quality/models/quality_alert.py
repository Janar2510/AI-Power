"""Quality alert (Phase 230)."""

from core.orm import Model, fields


class QualityAlert(Model):
    _name = "quality.alert"
    _description = "Quality Alert"

    name = fields.Char(string="Alert", required=True, default="New")
    check_id = fields.Many2one("quality.check", string="Quality Check")
    product_id = fields.Many2one("product.product", string="Product")
    severity = fields.Selection(
        selection=[
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High"),
        ],
        string="Severity",
        default="medium",
    )
    state = fields.Selection(
        selection=[
            ("open", "Open"),
            ("done", "Done"),
        ],
        string="Status",
        default="open",
    )
