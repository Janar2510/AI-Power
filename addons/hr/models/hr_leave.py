"""hr.leave - Leave requests with approval workflow (Phase 149)."""

from datetime import datetime, timedelta

from core.orm import Model, fields


def _weekday_count(date_from, date_to):
    """Count weekdays (Mon-Fri) between two dates inclusive."""
    if not date_from or not date_to:
        return 0.0
    try:
        if isinstance(date_from, str):
            date_from = datetime.strptime(date_from[:10], "%Y-%m-%d").date()
        elif hasattr(date_from, "date"):
            date_from = date_from.date() if hasattr(date_from, "date") else date_from
        if isinstance(date_to, str):
            date_to = datetime.strptime(date_to[:10], "%Y-%m-%d").date()
        elif hasattr(date_to, "date"):
            date_to = date_to.date() if hasattr(date_to, "date") else date_to
        if date_to < date_from:
            return 0.0
        count = 0
        d = date_from
        while d <= date_to:
            if d.weekday() < 5:
                count += 1
            d += timedelta(days=1)
        return float(count)
    except Exception:
        return 0.0


class HrLeave(Model):
    _name = "hr.leave"
    _description = "Leave Request"

    name = fields.Char(string="Description")
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    leave_type_id = fields.Many2one("hr.leave.type", string="Leave Type", required=True)
    date_from = fields.Date(string="From", required=True)
    date_to = fields.Date(string="To", required=True)
    number_of_days = fields.Float(string="Days", default=0)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirm", "To Approve"),
            ("validate", "Approved"),
            ("refuse", "Refused"),
        ],
        string="Status",
        default="draft",
        tracking=True,
    )
    work_entry_note = fields.Text(
        string="Work Entry Adjustment",
        readonly=True,
        help="Filled when leave is approved (Phase 491 HR lifecycle).",
    )

    @classmethod
    def _create_hr_leave_record(cls, vals):
        """Default `number_of_days` from dates + ORM insert (Phase 487: merge-safe for `_inherit` create)."""
        if "date_from" in vals or "date_to" in vals:
            vals = dict(vals)
            vals["number_of_days"] = _weekday_count(vals.get("date_from"), vals.get("date_to"))
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_hr_leave_record(vals)

    def write(self, vals):
        vals = dict(vals)
        if "date_from" in vals or "date_to" in vals:
            rows = self.read(["date_from", "date_to"])
            df = vals.get("date_from", rows[0].get("date_from") if rows else None)
            dt = vals.get("date_to", rows[0].get("date_to") if rows else None)
            vals["number_of_days"] = _weekday_count(df, dt)
        return super().write(vals)

    def action_confirm(self):
        """Submit for approval."""
        self.write({"state": "confirm"})

    def action_validate(self):
        """Manager approves; record work-entry adjustment note for payroll visibility."""
        for rec in self:
            row = rec.read(["number_of_days"])[0]
            days = float(row.get("number_of_days") or 0)
            note = f"Leave approved: {days:g} working day(s) marked for work entry adjustment."
            rec.write({"state": "validate", "work_entry_note": note})
        return True

    def action_refuse(self):
        """Manager refuses."""
        self.write({"state": "refuse"})

    def action_draft(self):
        """Reset to draft."""
        self.write({"state": "draft"})
