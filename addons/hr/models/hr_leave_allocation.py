"""hr.leave.allocation - Leave allocations (Phase 149)."""

from core.orm import Model, fields


class HrLeaveAllocation(Model):
    _name = "hr.leave.allocation"
    _description = "Leave Allocation"

    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    leave_type_id = fields.Many2one("hr.leave.type", string="Leave Type", required=True)
    number_of_days = fields.Float(string="Days", required=True, default=0)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirm", "To Approve"),
            ("validate", "Approved"),
            ("refuse", "Refused"),
        ],
        string="Status",
        default="draft",
    )
