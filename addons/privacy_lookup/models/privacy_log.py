"""Privacy log - track GDPR access/erasure requests."""

from core.orm import Model, fields


class PrivacyLog(Model):
    _name = "privacy.log"
    _description = "Privacy Log"

    res_model = fields.Char(string="Model")
    res_id = fields.Integer(string="Record ID")
    action = fields.Selection(
        selection=[("access", "Access"), ("erasure", "Erasure")],
        string="Action",
    )
    create_date = fields.Datetime()
