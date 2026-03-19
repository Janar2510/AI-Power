"""Employee hooks for future global time-off timesheets."""

from core.orm import Model


class HrEmployeeTimesheetHoliday(Model):
    _inherit = "hr.employee"

    def _delete_future_public_holidays_timesheets(self):
        return None

    def _create_future_public_holidays_timesheets(self, employees):
        del employees
        return None

    def write(self, vals):
        result = super().write(vals)
        if "resource_calendar_id" in vals or "active" in vals:
            self._delete_future_public_holidays_timesheets()
            self._create_future_public_holidays_timesheets(self)
        return result
