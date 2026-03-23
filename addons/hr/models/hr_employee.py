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
