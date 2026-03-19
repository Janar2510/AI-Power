"""Partner grade linkage (phase 319)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    grade_id = fields.Many2one("res.partner.grade", string="Partner Grade", ondelete="set null")
