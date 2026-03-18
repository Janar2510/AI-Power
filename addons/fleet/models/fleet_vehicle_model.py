"""Fleet vehicle model. Phase 224."""

from core.orm import Model, fields


class FleetVehicleModel(Model):
    _name = "fleet.vehicle.model"
    _description = "Vehicle Model"

    name = fields.Char(required=True)
    brand_id = fields.Many2one("fleet.vehicle.model.brand", string="Brand")
