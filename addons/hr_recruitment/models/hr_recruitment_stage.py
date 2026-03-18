"""Phase 217: Recruitment stages."""

from core.orm import Model, fields


class HrRecruitmentStage(Model):
    _name = "hr.recruitment.stage"
    _description = "Recruitment Stage"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10)
