"""Fleet vehicle contract log. Phase 224."""

from core.orm import Model, fields


class FleetVehicleLogContract(Model):
    _name = "fleet.vehicle.log.contract"
    _description = "Vehicle Contract"

    vehicle_id = fields.Many2one("fleet.vehicle", string="Vehicle", required=True)
    vendor_id = fields.Many2one("res.partner", string="Vendor")
    start_date = fields.Date(string="Start Date")
    end_date = fields.Date(string="End Date")
    cost = fields.Float(default=0)
    state = fields.Selection(
        selection=[("draft", "Draft"), ("active", "Active"), ("closed", "Closed")],
        default="draft",
    )
