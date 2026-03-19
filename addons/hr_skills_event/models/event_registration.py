"""Registration skills (Phase 307)."""

from core.orm import Model, fields


class EventRegistration(Model):
    _inherit = "event.registration"

    skill_ids = fields.Many2many(
        "hr.skill",
        "event_registration_hr_skill_rel",
        "registration_id",
        "skill_id",
        string="Skills",
    )
