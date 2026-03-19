"""Resource - link to calendar (Phase 238)."""

from core.orm import Model, fields


class ResourceResource(Model):
    _name = "resource.resource"
    _description = "Resource"

    name = fields.Char(required=True, string="Resource")
    calendar_id = fields.Many2one("resource.calendar", string="Working Schedule")
