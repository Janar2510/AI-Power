"""Employee presence display with holidays + homeworking (Odoo hr_holidays_homeworking parity)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    is_absent = fields.Boolean(string="Absent", default=False)
    hr_icon_display = fields.Char(string="HR Icon")
    show_hr_icon_display = fields.Boolean(string="Show HR Icon", default=False)

    def _compute_presence_icon(self):
        pass
