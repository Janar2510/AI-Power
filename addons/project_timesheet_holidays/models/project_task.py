"""Task flags for time-off tasks."""

from core.orm import Model, api, fields


class ProjectTaskTimesheetHoliday(Model):
    _inherit = "project.task"

    leave_types_count = fields.Integer(compute="_compute_leave_types_count", string="Time Off Types Count")
    is_timeoff_task = fields.Boolean(compute="_compute_is_timeoff_task", search="_search_is_timeoff_task")

    def _compute_leave_types_count(self):
        AnalyticLine = self.env.get("analytic.line") if getattr(self, "env", None) else None
        for task in self:
            if not AnalyticLine:
                task.leave_types_count = 0
                continue
            task.leave_types_count = AnalyticLine.search_count(
                [
                    ("task_id", "=", task.id),
                    "|",
                    ("holiday_id", "!=", False),
                    ("global_leave_id", "!=", False),
                ]
            )

    @api.depends("leave_types_count")
    def _compute_is_timeoff_task(self):
        for task in self:
            company = task.project_id.company_id if task.project_id else None
            default_task = company.leave_timesheet_task_id if company else None
            task.is_timeoff_task = bool(task.leave_types_count or (default_task and default_task.id == task.id))

    def _search_is_timeoff_task(self, operator, value):
        if operator not in ("=", "in"):
            return []
        AnalyticLine = self.env.get("analytic.line") if getattr(self, "env", None) else None
        if not AnalyticLine:
            return [("id", "=", -1)]
        task_ids = []
        for row in AnalyticLine.search(
            ["|", ("holiday_id", "!=", False), ("global_leave_id", "!=", False)]
        ).read(["task_id"]):
            task_id = row.get("task_id")
            if isinstance(task_id, (list, tuple)) and task_id:
                task_ids.append(task_id[0])
            elif task_id:
                task_ids.append(task_id)
        ids = list(set(task_ids))
        truthy = bool(value)
        if operator == "in":
            truthy = bool(value and True in value)
        if truthy:
            return [("id", "in", ids or [-1])]
        return [("id", "not in", ids or [-1])]
