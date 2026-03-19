"""Work location map for calendar period (Odoo hr_homeworking_calendar parity)."""

from core.orm import Model


class HrEmployee(Model):
    _inherit = "hr.employee"

    def _get_worklocation(self, start_date, end_date):
        return {}
