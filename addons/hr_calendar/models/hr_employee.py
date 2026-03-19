"""Extend hr.employee with meeting count (Phase 288)."""

from core.orm import Model, api, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    meeting_count = fields.Integer(string="Meetings", compute="_compute_meeting_count")

    @api.depends("name")
    def _compute_meeting_count(self):
        Event = self.env.get("calendar.event") if getattr(self, "env", None) else None
        for employee in self:
            if not Event:
                employee.meeting_count = 0
                continue
            employee.meeting_count = Event.search_count([("employee_id", "=", employee.id)])
