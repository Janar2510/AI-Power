"""base.import.mapping - Column mapping for import (Phase 244)."""

from core.orm import Model, fields


class BaseImportMapping(Model):
    _name = "base.import.mapping"
    _description = "Import Column Mapping"

    model_id = fields.Many2one("ir.model", string="Model")
    column_name = fields.Char(string="File Column")
    field_name = fields.Char(string="Model Field")
