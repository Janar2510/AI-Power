"""Extend sale.order with manufacturing order count."""

from core.orm import Model, api, fields


class SaleOrderMrp(Model):
    _inherit = "sale.order"

    production_count = fields.Integer(
        string="Manufacturing Count",
        compute="_compute_production_count",
    )

    @api.depends("order_line.mrp_production_ids")
    def _compute_production_count(self):
        for order in self:
            prod_ids = set()
            for line in order.order_line or []:
                for prod in line.mrp_production_ids or []:
                    if prod.id:
                        prod_ids.add(prod.id)
            order.production_count = len(prod_ids)
