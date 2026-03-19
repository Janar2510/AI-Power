"""Click-and-collect carrier field (phase 326)."""

from core.orm import Model, fields


class DeliveryCarrier(Model):
    _inherit = "delivery.carrier"

    is_collect = fields.Boolean(string="Is Collect", default=False)
