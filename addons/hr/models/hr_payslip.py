"""HR Payslip stub (Track P2 — payroll stubs).

Provides a minimal payslip model that computes gross pay from contract wage
and attendance lines. Full payroll compute rules are deferred (P4/gated).
"""

from core.orm import Model, api, fields


class HrPayslip(Model):
    _name = "hr.payslip"
    _description = "Employee Payslip"

    name = fields.Char(string="Payslip Reference", readonly=True)
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    contract_id = fields.Many2one("hr.contract", string="Contract")
    date_from = fields.Date(string="Period Start", required=True)
    date_to = fields.Date(string="Period End", required=True)
    worked_days = fields.Float(string="Worked Days", default=0.0)
    gross_wage = fields.Float(string="Gross Wage", compute="_compute_gross_wage", store=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("done", "Confirmed"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )

    @api.depends("contract_id", "worked_days")
    def _compute_gross_wage(self):
        """Stub computation: daily rate × worked_days from contract wage (monthly basis / 22 days)."""
        for slip in self:
            contract_ref = slip.read(["contract_id", "worked_days"])[0]
            cid = contract_ref.get("contract_id")
            if isinstance(cid, (list, tuple)) and cid:
                cid = cid[0]
            worked = float(contract_ref.get("worked_days") or 0)
            if not cid or worked <= 0:
                slip.gross_wage = 0.0
                continue
            env = getattr(slip, "env", None)
            Contract = env.get("hr.contract") if env else None
            if Contract:
                cdata = Contract.browse(cid).read(["wage"])[0]
                monthly = float(cdata.get("wage") or 0)
                daily_rate = monthly / 22.0
                slip.gross_wage = round(daily_rate * worked, 2)
            else:
                slip.gross_wage = 0.0

    def _auto_fill_contract(self):
        """Link payslip to the employee's first running contract when not set."""
        env = getattr(self, "env", None)
        Contract = env.get("hr.contract") if env else None
        if not Contract:
            return
        for slip in self:
            row = slip.read(["employee_id", "contract_id"])[0]
            if row.get("contract_id"):
                continue
            emp = row.get("employee_id")
            emp_id = emp[0] if isinstance(emp, (list, tuple)) and emp else emp
            if not emp_id:
                continue
            contracts = Contract.search([
                ("employee_id", "=", emp_id),
                ("state", "=", "open"),
            ], limit=1)
            if contracts and contracts.ids:
                slip.write({"contract_id": contracts.ids[0]})

    def action_confirm(self):
        """Confirm payslip; auto-fills contract if missing."""
        self._auto_fill_contract()
        for slip in self:
            state = slip.read(["state"])[0].get("state")
            if state == "draft":
                slip.write({"state": "done"})
        return True

    def action_cancel(self):
        for slip in self:
            state = slip.read(["state"])[0].get("state")
            if state != "cancel":
                slip.write({"state": "cancel"})
        return True

    @classmethod
    def create(cls, vals):
        """Auto-generate payslip reference from sequence if not provided."""
        if not vals.get("name"):
            env = getattr(cls._registry, "_env", None)
            seq = env.get("ir.sequence") if env else None
            if seq:
                next_val = seq.next_by_code("hr.payslip")
                if next_val:
                    vals = dict(vals, name=f"SLIP/{next_val:05d}")
        return super().create(vals)
