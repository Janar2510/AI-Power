"""Fleet vehicle. Phase 224."""

from core.orm import Model, fields


class FleetVehicle(Model):
    _name = "fleet.vehicle"
    _description = "Vehicle"

    name = fields.Char(required=True)
    license_plate = fields.Char(string="License Plate")
    model_id = fields.Many2one("fleet.vehicle.model", string="Model")
    driver_id = fields.Many2one("res.partner", string="Driver")
    state = fields.Selection(
        selection=[
            ("new", "New"),
            ("running", "Running"),
            ("maintenance", "Maintenance"),
            ("decommissioned", "Decommissioned"),
        ],
        default="new",
    )
    odometer = fields.Float(default=0)
    fuel_type = fields.Selection(
        selection=[
            ("gasoline", "Gasoline"),
            ("diesel", "Diesel"),
            ("electric", "Electric"),
            ("hybrid", "Hybrid"),
        ],
    )
    acquisition_date = fields.Date(string="Acquisition Date")
    contract_ids = fields.One2many("fleet.vehicle.log.contract", "vehicle_id", string="Contracts")
    fuel_log_ids = fields.One2many("fleet.vehicle.log.fuel", "vehicle_id", string="Fuel Logs")
    service_ids = fields.One2many("fleet.vehicle.log.services", "vehicle_id", string="Services")
