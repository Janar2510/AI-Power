"""Phase 215: AI forecast storage for dashboard display."""

from core.orm import Model, fields


class AIForecast(Model):
    _name = "ai.forecast"
    _description = "AI Forecast"

    model = fields.Char(string="Model")
    measure = fields.Char(string="Measure")
    periods_ahead = fields.Integer(string="Periods Ahead")
    forecast_values = fields.Text(string="Forecast JSON")
    last_value = fields.Float(string="Last Value")
    create_date = fields.Datetime(string="Created")
