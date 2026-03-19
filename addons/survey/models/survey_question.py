"""survey.question (Phase 243)."""

from core.orm import Model, fields


class SurveyQuestion(Model):
    _name = "survey.question"
    _description = "Survey Question"

    survey_id = fields.Many2one("survey.survey", string="Survey", required=True, ondelete="cascade")
    title = fields.Char(required=True, string="Question")
    sequence = fields.Integer(default=10)
