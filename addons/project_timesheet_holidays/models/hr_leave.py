"""Generate timesheets from leave validation."""

from core.orm import Model, fields


class HrLeaveTimesheet(Model):
    _inherit = "hr.leave"

    timesheet_ids = fields.One2many("analytic.line", "holiday_id", string="Timesheets")

    def _timesheet_prepare_line_values(self, project, task):
        self.ensure_one()
        return {
            "name": f"Time Off {self.id}",
            "project_id": project.id,
            "task_id": task.id,
            "employee_id": self.employee_id.id,
            "holiday_id": self.id,
            "unit_amount": self.number_of_days or 0.0,
            "date": self.date_from,
        }

    def _generate_timesheets(self, ignored_resource_calendar_leaves=None):
        del ignored_resource_calendar_leaves
        AnalyticLine = self.env.get("analytic.line") if getattr(self, "env", None) else None
        if not AnalyticLine:
            return
        for leave in self:
            employee = leave.employee_id
            if not employee:
                continue
            company = employee.company_id
            if not company:
                continue
            project = company.internal_project_id
            task = company.leave_timesheet_task_id
            if not project or not task:
                continue
            old_lines = AnalyticLine.search([("holiday_id", "=", leave.id)])
            if old_lines:
                old_lines.write({"holiday_id": False})
                old_lines.unlink()
            AnalyticLine.sudo().create(leave._timesheet_prepare_line_values(project, task))

    def action_validate(self):
        result = super().action_validate()
        self._generate_timesheets()
        return result

    def action_refuse(self):
        result = super().action_refuse()
        lines = self.sudo().mapped("timesheet_ids")
        if lines:
            lines.write({"holiday_id": False})
            lines.unlink()
        return result
