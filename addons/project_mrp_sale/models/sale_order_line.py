"""Sale line ↔ project manufacturing (plan field)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    project_production_ids = fields.Many2many(
        "mrp.production",
        "sale_order_line_project_mrp_production_rel",
        "order_line_id",
        "production_id",
        string="Project Manufacturing Orders",
    )
