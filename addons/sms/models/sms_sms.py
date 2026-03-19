"""Outgoing SMS message."""

from core.orm import Model, fields


class SmsSms(Model):
    _name = "sms.sms"
    _description = "Outgoing SMS"
    _rec_name = "number"
    _order = "id desc"

    number = fields.Char(string="Number", required=True)
    body = fields.Text(string="Body")
    partner_id = fields.Many2one("res.partner", string="Customer")
    state = fields.Selection(
        selection=[
            ("outgoing", "In Queue"),
            ("process", "Processing"),
            ("pending", "Sent"),
            ("sent", "Delivered"),
            ("error", "Error"),
            ("canceled", "Cancelled"),
        ],
        default="outgoing",
        required=True,
    )
