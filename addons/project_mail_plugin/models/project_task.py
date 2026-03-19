"""Mail plugin field on project task (phase 329)."""

from core.orm import Model, fields


class ProjectTask(Model):
    _inherit = "project.task"

    mail_plugin_linked = fields.Boolean(string="Mail Plugin Linked", default=False)
