"""Employment contract (Phase B4 HR depth subset)."""

from core.orm import Model, fields


class HrContract(Model):
    _name = "hr.contract"
    _description = "Employee Contract"

    name = fields.Char(string="Contract Reference", required=True)
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True, ondelete="cascade")
    date_start = fields.Date(string="Start Date", required=True)
    date_end = fields.Date(string="End Date")
    wage = fields.Float(string="Wage", default=0.0)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("open", "Running"),
            ("close", "Expired"),
        ],
        string="Status",
        default="draft",
    )

    def action_open(self):
        for c in self:
            c.write({"state": "open"})
        return True

    def action_close(self):
        for c in self:
            c.write({"state": "close"})
        return True
