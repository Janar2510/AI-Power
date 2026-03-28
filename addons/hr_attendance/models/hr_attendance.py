"""Phase 217: HR Attendance - check-in/out, worked_hours computed."""

from datetime import datetime, timezone

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

    def action_check_out(self):
        """Set check_out to UTC now when missing (Phase B4)."""
        now = datetime.now(timezone.utc).isoformat()
        for rec in self:
            row = rec.read(["check_out"])[0]
            if not row.get("check_out"):
                rec.write({"check_out": now})
        return True

    @classmethod
    def create(cls, vals):
        rec = super().create(vals)
        env = getattr(rec, "env", None) or (
            getattr(cls._registry, "_env", None) if getattr(cls, "_registry", None) else None
        )
        Employee = env.get("hr.employee") if env else None
        if not Employee:
            return rec
        for r in rec:
            row = r.read(["employee_id"])[0]
            eid = row.get("employee_id")
            if isinstance(eid, (list, tuple)) and eid:
                eid = eid[0]
            if not eid:
                continue
            er = Employee.browse(eid).read(["lifecycle_status"])[0]
            if er.get("lifecycle_status") == "onboarding":
                Employee.browse(eid).write({"lifecycle_status": "active"})
        return rec
