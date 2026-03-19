"""Extend hr.employee with gamification badges (Phase 287)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    badge_ids = fields.One2many(
        "gamification.badge.user",
        "employee_id",
        string="Badges",
    )
