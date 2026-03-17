"""Calendar event (Phase 167)."""

from core.orm import Model, api, fields


class CalendarEvent(Model):
    _name = "calendar.event"
    _description = "Calendar Event"

    name = fields.Char(required=True, string="Meeting Subject")
    start = fields.Datetime(string="Start", required=True)
    stop = fields.Datetime(string="End", required=True)
    allday = fields.Boolean(string="All Day", default=False)
    duration = fields.Computed(compute="_compute_duration", store=False, string="Duration")
    partner_ids = fields.Many2many(
        "res.partner",
        "calendar_event_res_partner_rel",
        "event_id",
        "partner_id",
        string="Attendees",
    )
    user_id = fields.Many2one("res.users", string="Organizer")
    location = fields.Char(string="Location")
    description = fields.Text(string="Description")
    privacy = fields.Selection(
        selection=[
            ("public", "Public"),
            ("private", "Private"),
        ],
        default="public",
        string="Privacy",
    )
    show_as = fields.Selection(
        selection=[
            ("busy", "Busy"),
            ("free", "Free"),
        ],
        default="busy",
        string="Show As",
    )
    recurrence_id = fields.Integer(string="Recurrence ID", readonly=True)
    attendee_ids = fields.One2many(
        "calendar.attendee",
        "event_id",
        string="Attendees",
    )

    @api.depends("start", "stop")
    def _compute_duration(self):
        if not self:
            return []
        from datetime import datetime
        rows = self.read(["start", "stop"])
        result = []
        for r in rows:
            start_s = r.get("start")
            stop_s = r.get("stop")
            if start_s and stop_s:
                try:
                    start_dt = datetime.fromisoformat(str(start_s).replace("Z", "+00:00"))
                    stop_dt = datetime.fromisoformat(str(stop_s).replace("Z", "+00:00"))
                    delta = stop_dt - start_dt
                    result.append(delta.total_seconds() / 3600.0)
                except Exception:
                    result.append(0.0)
            else:
                result.append(0.0)
        return result
