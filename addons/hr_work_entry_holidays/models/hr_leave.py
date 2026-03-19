"""Time off ↔ work entry type (plan field)."""

from core.orm import Model, fields


class HrLeave(Model):
    _inherit = "hr.leave"

    work_entry_type_id = fields.Many2one(
        "hr.work.entry.type",
        string="Work Entry Type",
        ondelete="set null",
    )
