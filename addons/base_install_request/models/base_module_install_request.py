"""Module install request model (phase 319)."""

from core.orm import Model, fields


class BaseModuleInstallRequest(Model):
    _name = "base.module.install.request"
    _description = "Base Module Install Request"

    module_name = fields.Char(string="Module Name", required=True)
    requester_id = fields.Many2one("res.users", string="Requester", ondelete="set null")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("approved", "Approved"), ("rejected", "Rejected")],
        string="State",
        default="draft",
    )
