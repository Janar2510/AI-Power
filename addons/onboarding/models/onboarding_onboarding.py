"""Onboarding flow definition (Phase 249)."""

from core.orm import Model, fields


class OnboardingOnboarding(Model):
    _name = "onboarding.onboarding"
    _description = "Onboarding"

    name = fields.Char(string="Name", required=True)
    route_name = fields.Char(string="Route Name")
    sequence = fields.Integer(string="Sequence", default=10)
    step_ids = fields.One2many(
        "onboarding.onboarding.step",
        "onboarding_id",
        string="Steps",
    )
    is_per_company = fields.Boolean(string="Per Company", default=True)
