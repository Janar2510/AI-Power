"""Survey/CRM bridge tags on surveys (phase 303)."""

from core.orm import Model, fields


class SurveySurvey(Model):
    _inherit = "survey.survey"

    crm_tag_ids = fields.Many2many(
        "crm.tag",
        "survey_crm_tag_rel",
        "survey_id",
        "tag_id",
        string="CRM Tags",
    )
