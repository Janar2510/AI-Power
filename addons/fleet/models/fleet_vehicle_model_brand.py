"""Fleet vehicle brand. Phase 224."""

from core.orm import Model, fields


class FleetVehicleModelBrand(Model):
    _name = "fleet.vehicle.model.brand"
    _description = "Vehicle Brand"

    name = fields.Char(required=True)
