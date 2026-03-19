"""hr.skill.type (Phase 245)."""

from core.orm import Model, fields


class HrSkillType(Model):
    _name = "hr.skill.type"
    _description = "Skill Type"

    name = fields.Char(required=True, string="Type")
