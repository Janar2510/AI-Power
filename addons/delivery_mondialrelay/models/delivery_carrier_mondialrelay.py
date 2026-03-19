"""Mondial Relay carrier model (phase 328)."""

from core.orm import Model, fields


class DeliveryCarrierMondialrelay(Model):
    _name = "delivery.carrier.mondialrelay"
    _description = "Delivery Carrier Mondialrelay"

    carrier_id = fields.Many2one("delivery.carrier", string="Carrier", ondelete="cascade")
    api_key = fields.Char(string="API Key", default="")
    country_ids = fields.Many2many(
        "res.country",
        "delivery_mondialrelay_country_rel",
        "mondialrelay_id",
        "country_id",
        string="Countries",
    )
