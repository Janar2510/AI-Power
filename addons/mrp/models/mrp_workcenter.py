"""Work Center (Phase 153)."""

from core.orm import Model, fields


class MrpWorkcenter(Model):
    _name = "mrp.workcenter"
    _description = "Work Center"

    name = fields.Char(string="Name", required=True)
    capacity = fields.Float(string="Capacity", default=1.0)
    time_start = fields.Float(string="Setup Time (min)", default=0.0)
    time_stop = fields.Float(string="Cleanup Time (min)", default=0.0)
