"""ir.model.data — XML IDs for generic data loading (Phase 409)."""

from core.orm import Model, fields


class IrModelData(Model):
    _name = "ir.model.data"
    _description = "External ID"
    _table = "ir_model_data"

    module = fields.Char(required=True, string="Module")
    name = fields.Char(required=True, string="External Identifier")
    model = fields.Char(required=True, string="Model")
    res_id = fields.Integer(required=True, string="Record ID")
    noupdate = fields.Boolean(string="No Update", default=False)
