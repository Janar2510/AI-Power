"""Onboarding progress step status (Phase 249)."""

from core.orm import Model, fields


class OnboardingProgressStep(Model):
    _name = "onboarding.progress.step"
    _description = "Onboarding Progress Step"

    step_id = fields.Many2one(
        "onboarding.onboarding.step",
        string="Step",
        required=True,
        ondelete="cascade",
    )
    progress_id = fields.Many2one(
        "onboarding.progress",
        string="Progress",
        required=True,
        ondelete="cascade",
    )
    state = fields.Selection(
        [
            ("not_started", "Not Started"),
            ("in_progress", "In Progress"),
            ("done", "Done"),
        ],
        string="State",
        default="not_started",
    )
