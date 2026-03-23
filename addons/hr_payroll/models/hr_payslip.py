"""Payslip model - compute sheet from salary rules (Phase 186)."""

from datetime import datetime

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
    def _create_hr_payslip_record(cls, vals):
        """Name from sequence + ORM insert (Phase 488: merge-safe for `_inherit` create)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSeq = env.get("ir.sequence") if env else None
            next_val = IrSeq.next_by_code("hr.payslip") if IrSeq else None
            vals = dict(vals, name=f"PAY/{next_val:05d}" if next_val else "New")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_hr_payslip_record(vals)

    def _payslip_total_attendance_hours(self, env, slip):
        """Sum worked hours from hr.attendance in payslip date range (Phase 491)."""
        Att = env.get("hr.attendance")
        if not Att:
            return 0.0
        row = slip.read(["employee_id", "date_from", "date_to"])[0]
        eid = row.get("employee_id")
        if isinstance(eid, (list, tuple)) and eid:
            eid = eid[0]
        if not eid:
            return 0.0
        df = row.get("date_from")
        dt = row.get("date_to")
        df_s = (str(df)[:10] if df else "") or "0000-00-00"
        dt_s = (str(dt)[:10] if dt else "") or "9999-12-31"
        atts = Att.search([("employee_id", "=", eid)])
        total = 0.0
        for a in atts:
            ar = a.read(["check_in", "check_out"])[0]
            ci, co = ar.get("check_in"), ar.get("check_out")
            if not ci or not co:
                continue
            ci_s = str(ci)[:10]
            if ci_s < df_s or ci_s > dt_s:
                continue
            try:
                if isinstance(ci, str):
                    ci = datetime.fromisoformat(ci.replace("Z", "+00:00"))
                if isinstance(co, str):
                    co = datetime.fromisoformat(co.replace("Z", "+00:00"))
                total += max(0.0, (co - ci).total_seconds() / 3600.0)
            except Exception:
                continue
        return total

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
            att_hrs = self._payslip_total_attendance_hours(env, slip)
            if att_hrs > 0 and rules.ids:
                hourly_addon = 1.0
                Line.create({
                    "slip_id": slip.id,
                    "rule_id": rules.ids[0],
                    "amount": att_hrs * hourly_addon,
                })
        Recordset(self._model, draft_ids, _env=getattr(self, "_env", None)).write({"state": "done"})
        return True
