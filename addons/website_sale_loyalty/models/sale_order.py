"""Website loyalty fields on sale order (phase 325)."""

from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    website_loyalty_reward_ids = fields.Many2many(
        "loyalty.reward",
        "sale_order_website_loyalty_reward_rel",
        "order_id",
        "reward_id",
        string="Website Loyalty Rewards",
    )
