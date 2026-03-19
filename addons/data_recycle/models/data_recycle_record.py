"""data.recycle.record - Record to recycle. Phase 261."""

from core.orm import Model, fields


class DataRecycleRecord(Model):
    _name = "data.recycle.record"
    _description = "Data Recycle Record"

    recycle_model_id = fields.Many2one("data.recycle.model", required=True)
    res_id = fields.Integer(required=True)
    res_model_name = fields.Char(required=True)
    name = fields.Char()
