"""Work entry type ↔ leave types (plan: leave_type_ids One2many)."""

from core.orm import Model, fields


class HrWorkEntryType(Model):
    _inherit = "hr.work.entry.type"

    leave_type_ids = fields.One2many(
        "hr.leave.type",
        "work_entry_type_id",
        string="Leave Types",
    )
