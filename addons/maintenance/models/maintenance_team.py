"""Maintenance team (Phase 232)."""

from core.orm import Model, fields


class MaintenanceTeam(Model):
    _name = "maintenance.team"
    _description = "Maintenance Team"

    name = fields.Char(string="Name", required=True)
