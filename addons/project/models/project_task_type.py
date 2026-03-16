"""Project Task Type model - pipeline stages for tasks."""

from core.orm import Model, fields


class ProjectTaskType(Model):
    _name = "project.task.type"
    _description = "Project Task Stage"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10)
    fold = fields.Boolean(default=False)
