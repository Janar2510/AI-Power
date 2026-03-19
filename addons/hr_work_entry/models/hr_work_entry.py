"""Work entry - timed work record (Phase 250)."""

from core.orm import Model, fields


class HrWorkEntry(Model):
    _name = "hr.work.entry"
    _description = "Work Entry"

    name = fields.Char(string="Name", required=True)
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    work_entry_type_id = fields.Many2one(
        "hr.work.entry.type",
        string="Work Entry Type",
        required=True,
    )
    date_start = fields.Datetime(string="Start", required=True)
    date_stop = fields.Datetime(string="Stop", required=True)
    duration = fields.Float(string="Duration")
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("validated", "Validated"),
            ("conflict", "Conflict"),
            ("cancelled", "Cancelled"),
        ],
        string="State",
        default="draft",
    )
