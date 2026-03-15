"""Stock picking type (Phase 116)."""

from core.orm import Model, fields


class StockPickingType(Model):
    _name = "stock.picking.type"
    _description = "Picking Type"

    name = fields.Char(string="Operation Type", required=True)
    code = fields.Selection(
        selection=[
            ("outgoing", "Delivery"),
            ("incoming", "Receipt"),
            ("internal", "Internal Transfer"),
        ],
        string="Type",
        required=True,
    )
    warehouse_id = fields.Many2one("stock.warehouse", string="Warehouse")
    default_location_src_id = fields.Many2one("stock.location", string="Default Source Location")
    default_location_dest_id = fields.Many2one("stock.location", string="Default Destination Location")
