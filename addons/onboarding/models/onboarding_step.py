"""Onboarding step definition (Phase 249)."""

from core.orm import Model, fields


class OnboardingStep(Model):
    _name = "onboarding.onboarding.step"
    _description = "Onboarding Step"

    title = fields.Char(string="Title", required=True)
    description = fields.Text(string="Description")
    done_icon = fields.Char(string="Done Icon")
    panel_step_open_action_name = fields.Char(string="Panel Step Open Action")
    onboarding_id = fields.Many2one(
        "onboarding.onboarding",
        string="Onboarding",
        required=True,
        ondelete="cascade",
    )
