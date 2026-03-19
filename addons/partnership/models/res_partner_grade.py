"""Partner grade model (phase 319)."""

from core.orm import Model, fields


class ResPartnerGrade(Model):
    _name = "res.partner.grade"
    _description = "Partner Grade"

    name = fields.Char(string="Name", required=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)
