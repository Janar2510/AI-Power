"""Work entry type classification (Phase 250)."""

from core.orm import Model, fields


class HrWorkEntryType(Model):
    _name = "hr.work.entry.type"
    _description = "Work Entry Type"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code")
    color = fields.Integer(string="Color")
    leave_id = fields.Many2one("hr.leave.type", string="Leave Type")
    is_leave = fields.Boolean(string="Is Leave", default=False)
    is_unforeseen = fields.Boolean(string="Unforeseen", default=False)
    active = fields.Boolean(string="Active", default=True)
