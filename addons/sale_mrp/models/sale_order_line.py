"""Extend sale.order.line with manufacturing links."""

from core.orm import Model, api, fields


class SaleOrderLineMrp(Model):
    _inherit = "sale.order.line"

    mrp_production_ids = fields.Many2many(
        "mrp.production",
        "sale_order_line_mrp_production_rel",
        "sale_line_id",
        "production_id",
        string="Manufacturing Orders",
        readonly=True,
        copy=False,
    )
    production_count = fields.Integer(
        string="Production Count",
        compute="_compute_production_count",
    )

    @api.depends("mrp_production_ids")
    def _compute_production_count(self):
        for line in self:
            line.production_count = len(line.mrp_production_ids) if line.mrp_production_ids else 0
