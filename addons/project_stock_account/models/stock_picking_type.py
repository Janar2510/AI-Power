"""Picking type generates analytic entries from project (Odoo project_stock_account parity)."""

from core.orm import Model, fields


class StockPickingType(Model):
    _inherit = "stock.picking.type"

    analytic_costs = fields.Boolean(
        string="Analytic Costs",
        default=False,
        help="Validating pickings can post analytic lines for the project.",
    )
