"""SMS linked to applicant."""

from core.orm import Model, fields


class SmsSms(Model):
    _inherit = "sms.sms"

    applicant_id = fields.Many2one("hr.applicant", string="Applicant", ondelete="set null")
