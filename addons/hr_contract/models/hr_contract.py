"""Phase 217: Employee contract model."""

from core.orm import Model, fields
from core.orm.fields import Field as OrmField


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

    def action_open_contract(self):
        """Start contract: link employee, sync wage, set lifecycle active (Phase 491)."""
        env = getattr(self, "env", None)
        Employee = env.get("hr.employee") if env else None
        if not Employee:
            return True
        for rec in self:
            row = rec.read(["state", "employee_id", "wage"])[0]
            if row.get("state") != "draft":
                continue
            eid = row.get("employee_id")
            if isinstance(eid, (list, tuple)) and eid:
                eid = eid[0]
            if not eid:
                continue
            rec.write({"state": "open"})
            ev = {"contract_id": rec.ids[0], "lifecycle_status": "active"}
            wage = row.get("wage")
            if wage is not None and float(wage or 0) and isinstance(getattr(Employee, "wage", None), OrmField):
                ev["wage"] = float(wage)
            Employee.browse(eid).write(ev)
        return True
