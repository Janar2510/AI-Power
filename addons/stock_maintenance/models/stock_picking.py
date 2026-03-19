"""Stock picking bridge to maintenance requests (phase 305)."""

from core.orm import Model, fields


class StockPicking(Model):
    _inherit = "stock.picking"

    maintenance_request_id = fields.Many2one(
        "maintenance.request",
        string="Maintenance Request",
        ondelete="set null",
    )
