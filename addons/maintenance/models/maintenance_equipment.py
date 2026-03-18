"""Maintenance equipment (Phase 232)."""

from core.orm import Model, fields


class MaintenanceEquipment(Model):
    _name = "maintenance.equipment"
    _description = "Equipment"

    name = fields.Char(string="Name", required=True)
    serial_no = fields.Char(string="Serial Number")
    category_id = fields.Many2one("maintenance.equipment.category", string="Category")
    assign_to_id = fields.Many2one("res.users", string="Assigned to")
    location = fields.Char(string="Location")
    active = fields.Boolean(default=True)


class MaintenanceEquipmentCategory(Model):
    _name = "maintenance.equipment.category"
    _description = "Equipment Category"

    name = fields.Char(string="Name", required=True)
