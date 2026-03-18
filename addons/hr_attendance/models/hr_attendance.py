"""Phase 217: HR Attendance - check-in/out, worked_hours computed."""

from datetime import datetime

from core.orm import Model, fields


class HrAttendance(Model):
    _name = "hr.attendance"
    _description = "Attendance"

    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    check_in = fields.Datetime(string="Check In", required=True)
    check_out = fields.Datetime(string="Check Out")
    worked_hours = fields.Computed(compute="_compute_worked_hours", store=False, string="Worked Hours")

    def _compute_worked_hours(self):
        """Compute worked_hours from check_in/check_out."""
        if not self.ids:
            return []
        rows = self.read(["check_in", "check_out"])
        result = []
        for r in rows:
            ci, co = r.get("check_in"), r.get("check_out")
            if ci and co:
                try:
                    if isinstance(ci, str):
                        ci = datetime.fromisoformat(ci.replace("Z", "+00:00"))
                    if isinstance(co, str):
                        co = datetime.fromisoformat(co.replace("Z", "+00:00"))
                    result.append((co - ci).total_seconds() / 3600.0)
                except Exception:
                    result.append(0.0)
            else:
                result.append(0.0)
        return result
