"""Presence tracking fields (Odoo hr_presence parity)."""

from datetime import datetime, timedelta

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
        now = datetime.utcnow()
        last_seen = getattr(self, "write_date", None) or getattr(self, "create_date", None)
        if last_seen and isinstance(last_seen, datetime):
            delta = now - last_seen
            if delta <= timedelta(hours=8):
                self.hr_presence_state = "present"
                self.hr_presence_state_display = "present"
                return "present"
        if getattr(self, "manually_set_present", False) or getattr(self, "manually_set_presence", False):
            self.hr_presence_state = "present"
            self.hr_presence_state_display = "present"
            return "present"
        self.hr_presence_state = "absent"
        self.hr_presence_state_display = "absent"
        return "absent"
