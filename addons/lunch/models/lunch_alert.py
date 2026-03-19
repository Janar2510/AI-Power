"""lunch.alert. Phase 260."""

from core.orm import Model, fields


class LunchAlert(Model):
    _name = "lunch.alert"
    _description = "Lunch Alert"

    message = fields.Text(required=True)
    alert_type = fields.Selection(selection=[("info", "Info"), ("warning", "Warning")], default="info")
    until = fields.Datetime(string="Until")
