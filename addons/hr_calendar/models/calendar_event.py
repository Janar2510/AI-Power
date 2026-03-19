"""Extend calendar.event with employee relation (Phase 288)."""

from core.orm import Model, fields


class CalendarEvent(Model):
    _inherit = "calendar.event"

    employee_id = fields.Many2one("hr.employee", string="Employee")
