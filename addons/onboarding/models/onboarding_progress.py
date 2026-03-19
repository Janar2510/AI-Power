"""Onboarding progress record (Phase 249)."""

from core.orm import Model, fields


class OnboardingProgress(Model):
    _name = "onboarding.progress"
    _description = "Onboarding Progress"

    onboarding_id = fields.Many2one(
        "onboarding.onboarding",
        string="Onboarding",
        required=True,
        ondelete="cascade",
    )
    company_id = fields.Many2one("res.company", string="Company")
    is_onboarding_closed = fields.Boolean(string="Closed", default=False)
    progress_step_ids = fields.One2many(
        "onboarding.progress.step",
        "progress_id",
        string="Progress Steps",
    )
