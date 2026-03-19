"""survey.survey (Phase 243)."""

from core.orm import Model, fields


class SurveySurvey(Model):
    _name = "survey.survey"
    _description = "Survey"

    title = fields.Char(required=True, string="Title")
    survey_url = fields.Char(string="Public URL")
