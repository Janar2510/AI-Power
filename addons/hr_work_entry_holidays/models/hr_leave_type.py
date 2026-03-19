"""Leave type ↔ work entry type (inverse for leave_type_ids)."""

from core.orm import Model, fields


class HrLeaveType(Model):
    _inherit = "hr.leave.type"

    work_entry_type_id = fields.Many2one(
        "hr.work.entry.type",
        string="Work Entry Type",
        ondelete="set null",
    )
