"""AI anomaly log (Phase 231)."""

from core.orm import Model, fields


class AIAnomaly(Model):
    _name = "ai.anomaly"
    _description = "AI Anomaly"

    anomaly_type = fields.Char(string="Type")
    severity = fields.Selection(
        selection=[
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High"),
        ],
        string="Severity",
        default="medium",
    )
    model_name = fields.Char(string="Model")
    res_id = fields.Integer(string="Record ID")
    explanation = fields.Text(string="Explanation")
    create_date = fields.Datetime(string="Created")
