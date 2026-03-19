"""Survey links on applicants and jobs (phase 329)."""

from core.orm import Model, fields


class HrApplicant(Model):
    _inherit = "hr.applicant"

    survey_id = fields.Many2one("survey.survey", string="Survey", ondelete="set null")


class HrJob(Model):
    _inherit = "hr.job"

    interview_survey_id = fields.Many2one("survey.survey", string="Interview Survey", ondelete="set null")
