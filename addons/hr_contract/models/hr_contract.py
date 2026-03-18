"""Phase 217: Employee contract model."""

from core.orm import Model, fields


class HrContract(Model):
    _name = "hr.contract"
    _description = "Contract"

    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    name = fields.Char(string="Contract Reference", required=True)
    wage = fields.Float(string="Wage")
    date_start = fields.Date(string="Start Date")
    date_end = fields.Date(string="End Date")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("open", "Running"),
            ("close", "Expired"),
        ],
        string="Status",
        default="draft",
    )
