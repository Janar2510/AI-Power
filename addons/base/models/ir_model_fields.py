"""ir.model.fields — field metadata (Phase 419)."""

from core.orm import Model, fields


class IrModelFields(Model):
    _name = "ir.model.fields"
    _description = "Fields"

    model_id = fields.Many2one("ir.model", required=True, string="Model", ondelete="cascade")
    name = fields.Char(required=True, string="Field Name")
    field_description = fields.Char(string="Field Label")
    ttype = fields.Char(string="Field Type")
    relation = fields.Char(string="Relation Model")
