"""Fleet vehicle fuel log. Phase 224."""

from core.orm import Model, fields


class FleetVehicleLogFuel(Model):
    _name = "fleet.vehicle.log.fuel"
    _description = "Vehicle Fuel Log"

    vehicle_id = fields.Many2one("fleet.vehicle", string="Vehicle", required=True)
    date = fields.Date()
    liters = fields.Float(default=0)
    cost = fields.Float(default=0)
    odometer = fields.Float(default=0)
