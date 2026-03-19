"""Company-level presence rules (Odoo hr_presence parity)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    hr_presence_control_ip = fields.Boolean(string="Presence: IP", default=False)
    hr_presence_control_ip_list = fields.Char(string="Presence IP List", default="")
    hr_presence_control_email = fields.Boolean(string="Presence: Email", default=False)
    hr_presence_control_email_amount = fields.Integer(string="Presence Email Threshold", default=0)
    hr_presence_last_compute_date = fields.Datetime(string="Presence Last Compute")
