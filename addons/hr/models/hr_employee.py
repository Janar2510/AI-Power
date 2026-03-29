"""HR Employee model."""

from core.orm import Model, api, fields


class HrEmployee(Model):
    _name = "hr.employee"
    _audit = True  # Phase 205
    _description = "Employee"

    name = fields.Char(required=True)
    department_id = fields.Many2one("hr.department", string="Department")
    job_id = fields.Many2one("hr.job", string="Job Position")
    work_email = fields.Char(string="Work Email")
    user_id = fields.Many2one("res.users", string="User")
    lifecycle_status = fields.Selection(
        selection=[
            ("new", "New"),
            ("onboarding", "Onboarding"),
            ("active", "Active"),
            ("departed", "Departed"),
        ],
        string="Lifecycle",
        default="new",
    )
    ai_attrition_risk_score = fields.Float(
        string="AI attrition risk",
        compute="_compute_ai_attrition_risk_score",
        store=False,
        help="Heuristic 0–1 risk score for HR analytics (Phase 497).",
    )

    @api.depends("lifecycle_status", "department_id")
    def _compute_ai_attrition_risk_score(self):
        if not self:
            return []
        rows = self.read(["lifecycle_status", "department_id"])
        out = []
        for r in rows:
            st = r.get("lifecycle_status") or "new"
            if st == "departed":
                out.append(1.0)
            elif st == "onboarding":
                out.append(0.25)
            elif st == "active":
                out.append(0.08 if r.get("department_id") else 0.12)
            else:
                out.append(0.15)
        return out

    def action_start_onboarding(self):
        """Mark employee as in onboarding (Phase 491 HR lifecycle)."""
        for rec in self:
            row = rec.read(["lifecycle_status"])[0]
            if row.get("lifecycle_status") in ("new", "onboarding"):
                rec.write({"lifecycle_status": "onboarding"})
        return True

    def action_contract_start(self):
        """Open the first running contract and promote lifecycle to active (Track P2).

        Workflow:
        1. Find the first contract for each employee with state == 'draft'.
        2. Transition that contract to 'open' (action_open).
        3. Advance the employee's lifecycle_status from 'onboarding' → 'active'.
        """
        env = getattr(self, "env", None)
        Contract = env.get("hr.contract") if env else None
        for rec in self:
            if Contract and rec.ids:
                contracts = Contract.search([
                    ("employee_id", "=", rec.ids[0]),
                    ("state", "=", "draft"),
                ], limit=1)
                if contracts and contracts.ids:
                    contracts.write({"state": "open"})
            row = rec.read(["lifecycle_status"])[0]
            if row.get("lifecycle_status") in ("onboarding", "new"):
                rec.write({"lifecycle_status": "active"})
        return True

    def action_attendance_promotion(self):
        """Record attendance-based promotion note and advance lifecycle if eligible (Track P2).

        Calculates the employee's total logged attendance hours (from hr.attendance)
        and, when the employee exceeds the configured promotion threshold (default 1000 h),
        moves the lifecycle to 'active' if not already there.
        """
        env = getattr(self, "env", None)
        Attendance = env.get("hr.attendance") if env else None
        for rec in self:
            if not rec.ids:
                continue
            total_hours = 0.0
            if Attendance:
                att_rows = Attendance.search([("employee_id", "=", rec.ids[0])])
                for att in (att_rows if att_rows.ids else []):
                    arow = att.read(["worked_hours"])[0]
                    total_hours += float(arow.get("worked_hours") or 0)
            row = rec.read(["lifecycle_status"])[0]
            current = row.get("lifecycle_status") or "new"
            if total_hours >= 1000.0 and current not in ("active", "departed"):
                rec.write({"lifecycle_status": "active"})
        return True

    def action_depart(self):
        """Mark employee as departed and close open contracts (Track P2)."""
        env = getattr(self, "env", None)
        Contract = env.get("hr.contract") if env else None
        for rec in self:
            if Contract and rec.ids:
                open_contracts = Contract.search([
                    ("employee_id", "=", rec.ids[0]),
                    ("state", "=", "open"),
                ])
                if open_contracts and open_contracts.ids:
                    open_contracts.write({"state": "close"})
            rec.write({"lifecycle_status": "departed"})
        return True
