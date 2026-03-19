"""Resource calendar - working hours (Phase 238)."""

from core.orm import Model, fields


class ResourceCalendar(Model):
    _name = "resource.calendar"
    _description = "Working Schedule"

    name = fields.Char(required=True, string="Schedule")
    attendance_ids = fields.One2many(
        "resource.calendar.attendance",
        "calendar_id",
        string="Working Times",
    )


class ResourceCalendarAttendance(Model):
    _name = "resource.calendar.attendance"
    _description = "Working Time"

    calendar_id = fields.Many2one("resource.calendar", string="Calendar", required=True, ondelete="cascade")
    dayofweek = fields.Selection(
        selection=[
            ("0", "Monday"),
            ("1", "Tuesday"),
            ("2", "Wednesday"),
            ("3", "Thursday"),
            ("4", "Friday"),
            ("5", "Saturday"),
            ("6", "Sunday"),
        ],
        string="Day",
        required=True,
    )
    hour_from = fields.Float(string="From", required=True)
    hour_to = fields.Float(string="To", required=True)
