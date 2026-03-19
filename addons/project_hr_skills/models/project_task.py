"""Task skills (plan: skill_ids Many2many hr.skill)."""

from core.orm import Model, fields


class ProjectTask(Model):
    _inherit = "project.task"

    skill_ids = fields.Many2many(
        "hr.skill",
        "project_task_hr_skill_rel",
        "task_id",
        "skill_id",
        string="Skills",
    )
