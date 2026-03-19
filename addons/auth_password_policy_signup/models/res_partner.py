"""Signup password-policy bridge (phase 304)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    signup_password_policy_enforced = fields.Boolean(
        string="Signup Password Policy Enforced",
        default=True,
    )
    signup_password_strength = fields.Selection(
        selection=[("weak", "Weak"), ("medium", "Medium"), ("strong", "Strong")],
        string="Signup Password Strength",
        default="medium",
    )

    def validate_signup_password_policy(self):
        return True
