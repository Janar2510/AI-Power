"""Employee presence display with holidays + homeworking (Odoo hr_holidays_homeworking parity)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    is_absent = fields.Boolean(string="Absent", default=False)
    hr_icon_display = fields.Char(string="HR Icon")
    show_hr_icon_display = fields.Boolean(string="Show HR Icon", default=False)

    def _compute_presence_icon(self):
        if getattr(self, "is_absent", False):
            self.hr_icon_display = "fa-plane"
            self.show_hr_icon_display = True
            return self.hr_icon_display
        if getattr(self, "work_location_type", "") == "home":
            self.hr_icon_display = "fa-home"
            self.show_hr_icon_display = True
            return self.hr_icon_display
        state = getattr(self, "hr_presence_state", "")
        if state == "present":
            self.hr_icon_display = "fa-user-check"
            self.show_hr_icon_display = True
            return self.hr_icon_display
        self.hr_icon_display = "fa-user-clock"
        self.show_hr_icon_display = False
        return self.hr_icon_display
