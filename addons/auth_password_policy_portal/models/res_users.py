"""Portal password-policy bridge (phase 304)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    portal_password_policy_enforced = fields.Boolean(
        string="Portal Password Policy Enforced",
        default=True,
    )
    portal_password_policy_level = fields.Selection(
        selection=[("none", "None"), ("standard", "Standard"), ("strict", "Strict")],
        string="Portal Password Policy Level",
        default="standard",
    )

    def validate_portal_password_policy(self):
        return True
