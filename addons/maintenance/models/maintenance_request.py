"""Maintenance request (Phase 232)."""

from core.orm import Model, fields


class MaintenanceRequest(Model):
    _name = "maintenance.request"
    _description = "Maintenance Request"

    name = fields.Char(string="Request", required=True, default="New")
    equipment_id = fields.Many2one("maintenance.equipment", string="Equipment", required=True)
    team_id = fields.Many2one("maintenance.team", string="Team")
    request_type = fields.Selection(
        selection=[
            ("corrective", "Corrective"),
            ("preventive", "Preventive"),
        ],
        string="Type",
        default="corrective",
    )
    state = fields.Selection(
        selection=[
            ("new", "New"),
            ("in_progress", "In Progress"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="new",
    )
