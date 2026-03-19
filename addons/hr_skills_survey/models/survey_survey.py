"""Survey skills (Phase 307)."""

from core.orm import Model, fields


class SurveySurvey(Model):
    _inherit = "survey.survey"

    skill_ids = fields.Many2many(
        "hr.skill",
        "survey_survey_hr_skill_rel",
        "survey_id",
        "skill_id",
        string="Skills",
    )
