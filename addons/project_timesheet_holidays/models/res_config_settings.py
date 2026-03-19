"""Settings bridge for leave timesheet defaults."""

from core.orm import fields
from core.orm.models_transient import TransientModel


class ResConfigSettingsTimesheetHoliday(TransientModel):
    _inherit = "res.config.settings"

    internal_project_id = fields.Many2one(
        related="company_id.internal_project_id",
        readonly=False,
        string="Internal Project",
    )
    leave_timesheet_task_id = fields.Many2one(
        related="company_id.leave_timesheet_task_id",
        readonly=False,
        string="Time Off Task",
    )
