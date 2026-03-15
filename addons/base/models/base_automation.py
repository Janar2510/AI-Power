"""base.automation - Automated actions (Phase 119)."""

from core.orm import Model, fields


class BaseAutomation(Model):
    _name = "base.automation"
    _description = "Automated Action"

    name = fields.Char(required=True, string="Action Name")
    model_name = fields.Char(required=True, string="Model")
    trigger = fields.Selection(
        selection=[
            ("on_create", "On Creation"),
            ("on_write", "On Update"),
            ("on_unlink", "On Deletion"),
            ("on_time", "Based on Timed Condition"),
        ],
        string="Trigger",
        required=True,
    )
    filter_domain = fields.Text(string="Filter Domain")  # JSON domain, optional
    action_server_id = fields.Many2one("ir.actions.server", string="Action To Do", required=True)
    active = fields.Boolean(default=True)
