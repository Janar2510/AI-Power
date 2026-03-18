"""Subscription plan model. Phase 221."""

from core.orm import Model, fields


class SaleSubscriptionPlan(Model):
    _name = "sale.subscription.plan"
    _description = "Subscription Plan"

    name = fields.Char(required=True)
    billing_period = fields.Selection(
        selection=[("monthly", "Monthly"), ("yearly", "Yearly")],
        default="monthly",
    )
    auto_renew = fields.Boolean(default=True)
