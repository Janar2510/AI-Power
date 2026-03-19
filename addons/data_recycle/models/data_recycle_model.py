"""data.recycle.model - Archival/delete rule. Phase 261."""

from core.orm import Model, fields


class DataRecycleModel(Model):
    _name = "data.recycle.model"
    _description = "Data Recycle Model"

    name = fields.Char(required=True)
    res_model_id = fields.Many2one("ir.model", string="Model", required=True)
    recycle_mode = fields.Selection(
        selection=[("archive", "Archive"), ("delete", "Delete")],
        default="archive",
    )
    time_field_name = fields.Char(string="Time Field Name")
    time_field_delta = fields.Integer(default=90)
    time_field_delta_unit = fields.Selection(
        selection=[("days", "Days"), ("weeks", "Weeks"), ("months", "Months")],
        default="days",
    )
