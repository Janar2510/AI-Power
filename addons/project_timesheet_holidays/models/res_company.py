"""Company-level defaults for leave-generated timesheets."""

from core.orm import Model, fields


class ResCompanyTimesheetHoliday(Model):
    _inherit = "res.company"

    internal_project_id = fields.Many2one("project.project", string="Internal Project")
    leave_timesheet_task_id = fields.Many2one(
        "project.task",
        string="Time Off Task",
        domain="[('project_id', '=', internal_project_id)]",
    )
