"""hr.leave.type - Leave types (Phase 149)."""

from core.orm import Model, fields


class HrLeaveType(Model):
    _name = "hr.leave.type"
    _description = "Leave Type"

    name = fields.Char(string="Name", required=True)
    allocation_type = fields.Selection(
        selection=[
            ("no", "No Allocation"),
            ("fixed", "Fixed"),
        ],
        string="Allocation",
        default="no",
    )
    color = fields.Integer(string="Color", default=0)
    max_leaves = fields.Float(string="Max Leaves", default=0)
    sequence = fields.Integer(string="Sequence", default=10)
