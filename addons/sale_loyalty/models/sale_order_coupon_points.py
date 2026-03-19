"""Coupon points linked to sale orders."""

from core.orm import Model, fields


class SaleOrderCouponPoints(Model):
    _name = "sale.order.coupon.points"
    _description = "Sale Order Coupon Points"

    order_id = fields.Many2one("sale.order", string="Order", required=True, ondelete="cascade")
    coupon_id = fields.Many2one("loyalty.card", string="Coupon", required=True)
    points = fields.Float(string="Points", default=0.0)
