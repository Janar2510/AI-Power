"""Presence tracking fields (Odoo hr_presence parity)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    email_sent = fields.Boolean(string="Email Sent", default=False)
    ip_connected = fields.Boolean(string="IP Connected", default=False)
    manually_set_present = fields.Boolean(string="Manually Set Present", default=False)
    manually_set_presence = fields.Boolean(string="Manually Set Presence", default=False)
    hr_presence_state = fields.Selection(
        selection=[
            ("present", "Present"),
            ("absent", "Absent"),
            ("to_define", "To Define"),
        ],
        string="Presence State",
        default="to_define",
    )
    hr_presence_state_display = fields.Selection(
        selection=[
            ("out_of_working_hour", "Off-Hours"),
            ("present", "Present"),
            ("absent", "Absent"),
        ],
        string="Presence Display",
        default="out_of_working_hour",
    )

    def _check_presence(self):
        pass
