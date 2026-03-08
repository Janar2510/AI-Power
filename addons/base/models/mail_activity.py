"""Mail Activity model - generic scheduled activities for any model (Phase 75)."""

from datetime import date, datetime
from typing import Any, Dict, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


def _state_from_deadline(date_deadline: Any) -> str:
    """Compute state from date_deadline."""
    if not date_deadline:
        return "planned"
    today = date.today()
    d = None
    if isinstance(date_deadline, date):
        d = date_deadline
    elif isinstance(date_deadline, str):
        try:
            d = datetime.strptime(date_deadline[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return "planned"
    if d is None:
        return "planned"
    if d < today:
        return "overdue"
    if d == today:
        return "today"
    return "planned"


class MailActivity(Model):
    _name = "mail.activity"
    _description = "Activity"

    res_model = fields.Char(required=True, string="Related Model")
    res_id = fields.Integer(required=True, string="Related Record ID")
    summary = fields.Char(string="Summary")
    note = fields.Text()
    date_deadline = fields.Date(string="Due Date")
    user_id = fields.Many2one("res.users", string="Assigned to")
    state = fields.Char(string="Status")  # overdue, today, planned - set on create/write

    @classmethod
    def create(cls: Type[T], vals: Dict[str, Any]) -> T:
        vals = dict(vals)
        if "state" not in vals and "date_deadline" in vals:
            vals["state"] = _state_from_deadline(vals["date_deadline"])
        elif "state" not in vals:
            vals["state"] = "planned"
        return super().create(vals)

    def write(self, vals: Dict[str, Any]) -> bool:
        vals = dict(vals)
        if "date_deadline" in vals and "state" not in vals:
            vals["state"] = _state_from_deadline(vals["date_deadline"])
        return super().write(vals)


class MailActivityMixin:
    """Python mixin: add activity_ids and activity_schedule to any model via inheritance.
    Use: class CrmLead(MailActivityMixin, Model): ...
    """

    activity_ids = fields.One2many(
        "mail.activity",
        "res_id",
        domain=lambda m: [("res_model", "=", m._name)],
        inverse_extra=lambda m: {"res_model": m._name},
        string="Activities",
    )

    def activity_schedule(
        self, summary: str, date_deadline: Any = None, note: str = "", user_id: int = None
    ) -> "MailActivity":
        """Schedule an activity on this record. date_deadline defaults to today."""
        env = getattr(self, "env", None)
        if not env:
            raise RuntimeError("activity_schedule requires env")
        MailActivity = env.get("mail.activity")
        if not MailActivity:
            raise RuntimeError("mail.activity model not found")
        rid = self.id if hasattr(self, "id") else (self.ids[0] if hasattr(self, "ids") and self.ids else None)
        if not rid:
            raise ValueError("activity_schedule requires a saved record")
        if date_deadline is None:
            date_deadline = date.today().isoformat()
        vals = {
            "res_model": self._model._name,
            "res_id": rid,
            "summary": summary,
            "date_deadline": date_deadline,
            "note": note or "",
        }
        if user_id is not None:
            vals["user_id"] = user_id
        return MailActivity.create(vals)
