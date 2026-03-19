"""delivery.carrier - Shipping methods (Phase 241)."""

from core.orm import Model, fields


class DeliveryCarrier(Model):
    _name = "delivery.carrier"
    _description = "Delivery Carrier"

    name = fields.Char(required=True, string="Carrier")
    active = fields.Boolean(default=True)
