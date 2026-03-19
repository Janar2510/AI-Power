"""Extend fleet.vehicle with invoice counter."""

from core.orm import Model, api, fields


class FleetVehicleAccount(Model):
    _inherit = "fleet.vehicle"

    invoice_count = fields.Integer(
        string="Invoice Count",
        compute="_compute_invoice_count",
    )

    @api.depends("name")
    def _compute_invoice_count(self):
        MoveLine = self.env["account.move.line"]
        for vehicle in self:
            vehicle.invoice_count = MoveLine.search_count([("vehicle_id", "=", vehicle.id)])
