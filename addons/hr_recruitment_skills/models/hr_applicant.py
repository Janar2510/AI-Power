"""Extend hr.applicant with skills (Phase 288)."""

from core.orm import Model, fields


class HrApplicant(Model):
    _inherit = "hr.applicant"

    skill_ids = fields.Many2many("hr.skill", string="Skills")
