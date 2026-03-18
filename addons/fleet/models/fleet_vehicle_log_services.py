"""Fleet vehicle service log. Phase 224."""

from core.orm import Model, fields


class FleetVehicleLogServices(Model):
    _name = "fleet.vehicle.log.services"
    _description = "Vehicle Service Log"

    vehicle_id = fields.Many2one("fleet.vehicle", string="Vehicle", required=True)
    date = fields.Date()
    service_type = fields.Char(string="Service Type")
    vendor_id = fields.Many2one("res.partner", string="Vendor")
    cost = fields.Float(default=0)
