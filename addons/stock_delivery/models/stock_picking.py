"""Stock picking carrier assignment."""

from core.orm import Model, fields


class StockPickingDelivery(Model):
    _inherit = "stock.picking"

    carrier_id = fields.Many2one("delivery.carrier", string="Carrier", copy=False)
    carrier_tracking_ref = fields.Char(string="Tracking Reference", copy=False)
    weight = fields.Float(string="Weight")
