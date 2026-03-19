"""Extend sale.order with loyalty tracking fields."""

from core.orm import Model, api, fields


class SaleOrderLoyalty(Model):
    _inherit = "sale.order"

    applied_coupon_ids = fields.Many2many(
        "loyalty.card",
        string="Manually Applied Coupons",
        copy=False,
    )
    code_enabled_rule_ids = fields.Many2many(
        "loyalty.rule",
        string="Manually Triggered Rules",
        copy=False,
    )
    coupon_point_ids = fields.One2many(
        "sale.order.coupon.points",
        "order_id",
        string="Coupon Points",
        copy=False,
    )
    reward_amount = fields.Float(
        string="Reward Amount",
        compute="_compute_loyalty_totals",
    )
    gift_card_count = fields.Integer(
        string="Gift Card Count",
        compute="_compute_loyalty_totals",
    )

    @api.depends("coupon_point_ids.points", "applied_coupon_ids")
    def _compute_loyalty_totals(self):
        for order in self:
            if order.coupon_point_ids:
                rows = order.coupon_point_ids.read(["points"])
                order.reward_amount = sum(r.get("points") or 0.0 for r in rows)
            else:
                order.reward_amount = 0.0
            order.gift_card_count = len(order.applied_coupon_ids) if order.applied_coupon_ids else 0
