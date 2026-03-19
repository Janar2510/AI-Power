"""Task stage SMS template bridge."""

from core.orm import Model, fields


class ProjectTaskTypeSms(Model):
    _inherit = "project.task.type"

    sms_template_id = fields.Many2one(
        "sms.template",
        string="SMS Template",
        help="SMS template sent when task reaches this stage.",
    )
