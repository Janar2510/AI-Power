"""Payslip model - compute sheet from salary rules (Phase 186)."""

from core.orm import Model, fields


class HrPayslip(Model):
    _name = "hr.payslip"
    _description = "Payslip"

    name = fields.Char(required=True, default="New")
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    date_from = fields.Date(required=True)
    date_to = fields.Date(required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        default="draft",
    )
    line_ids = fields.One2many(
        "hr.payslip.line",
        "slip_id",
        string="Payslip Lines",
    )

    @classmethod
    def create(cls, vals):
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSeq = env.get("ir.sequence") if env else None
            next_val = IrSeq.next_by_code("hr.payslip") if IrSeq else None
            vals = dict(vals, name=f"PAY/{next_val:05d}" if next_val else "New")
        return super().create(vals)

    def compute_sheet(self, env=None):
        """Apply salary rules and create payslip lines."""
        from core.orm.models import Recordset
        env = env or getattr(self, "env", None) or (getattr(self._model._registry, "_env", None) if getattr(self._model, "_registry", None) else None)
        if not env:
            return True
        ids = getattr(self, "_ids", None) or []
        if not ids:
            return True
        rows = self.read(["id", "state"])
        draft_ids = [r["id"] for r in rows if r.get("state") == "draft"]
        if not draft_ids:
            return True
        Rule = env.get("hr.salary.rule")
        Line = env.get("hr.payslip.line")
        if not Rule or not Line:
            Recordset(self._model, draft_ids, _env=getattr(self, "_env", None)).write({"state": "done"})
            return True
        rules = Rule.search([], order="id")
        if not rules.ids:
            Recordset(self._model, draft_ids, _env=getattr(self, "_env", None)).write({"state": "done"})
            return True
        for slip in Recordset(self._model, draft_ids, _env=getattr(self, "_env", None)):
            employee = slip.employee_id
            wage = float(getattr(employee, "wage", 0) or 0)
            base = wage
            existing = Line.search([("slip_id", "=", slip.id)])
            if existing.ids:
                existing.unlink()
            for rule_id in rules.ids:
                rule_rec = Rule.browse(rule_id)
                rule_row = rule_rec.read(["amount_fix", "amount_percentage"])[0]
                amt_fix = float(rule_row.get("amount_fix") or 0)
                amt_pct = float(rule_row.get("amount_percentage") or 0)
                amount = amt_fix + (base * amt_pct / 100.0)
                Line.create({"slip_id": slip.id, "rule_id": rule_id, "amount": amount})
        Recordset(self._model, draft_ids, _env=getattr(self, "_env", None)).write({"state": "done"})
        return True
