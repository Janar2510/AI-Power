"""Project Task model."""

from addons.mail.models.mail_activity import MailActivityMixin
from addons.mail.models.mail_thread import MailThreadMixin
from core.orm import Model, fields


class ProjectTask(MailActivityMixin, MailThreadMixin, Model):
    _name = "project.task"
    _description = "Project Task"

    name = fields.Char(required=True)
    project_id = fields.Many2one("project.project", string="Project")
    stage_id = fields.Many2one("project.task.type", string="Stage")
    user_ids = fields.Many2many("res.users", string="Assignees")
    date_deadline = fields.Date(string="Deadline")
    description = fields.Text()
