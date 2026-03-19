"""Survey/CRM bridge fields (phase 303)."""

from core.orm import Model, api, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    survey_ids = fields.Many2many(
        "survey.survey",
        "crm_lead_survey_rel",
        "lead_id",
        "survey_id",
        string="Surveys",
    )
    survey_count = fields.Computed(
        compute="_compute_survey_count",
        store=False,
        string="Survey Count",
    )

    @api.depends("survey_ids")
    def _compute_survey_count(self):
        return [0] * len(self._ids)
