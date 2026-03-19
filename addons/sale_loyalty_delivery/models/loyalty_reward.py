"""Minimal loyalty.reward model with delivery bridge fields."""

from core.orm import Model, fields


class LoyaltyReward(Model):
    _name = "loyalty.reward"
    _description = "Loyalty Reward"

    name = fields.Char(string="Reward", required=True)
    program_id = fields.Many2one("loyalty.program", string="Program")
    reward_type = fields.Selection(
        selection=[
            ("product", "Product"),
            ("discount", "Discount"),
            ("free_shipping", "Free Shipping"),
        ],
        string="Reward Type",
        default="discount",
    )
    delivery_carrier_id = fields.Many2one("delivery.carrier", string="Delivery Carrier")
