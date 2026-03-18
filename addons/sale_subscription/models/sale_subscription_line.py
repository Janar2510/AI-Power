"""Subscription line model. Phase 221."""

from core.orm import Model, fields


class SaleSubscriptionLine(Model):
    _name = "sale.subscription.line"
    _description = "Subscription Line"

    subscription_id = fields.Many2one("sale.subscription", string="Subscription", required=True)
    product_id = fields.Many2one("product.product", string="Product")
    quantity = fields.Float(default=1)
    price_unit = fields.Float(default=0)
    price_subtotal = fields.Float(default=0)
