"""hr.skill (Phase 245)."""

from core.orm import Model, fields


class HrSkill(Model):
    _name = "hr.skill"
    _description = "Skill"

    name = fields.Char(required=True, string="Skill")
    skill_type_id = fields.Many2one("hr.skill.type", string="Type")
