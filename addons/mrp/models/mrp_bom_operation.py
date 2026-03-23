"""BOM operations — routing steps for manufacturing (Phase 526 / Odoo-style MRP)."""

from core.orm import Model, fields


class MrpBomOperation(Model):
    _name = "mrp.bom.operation"
    _description = "Bill of Materials Operation"

    bom_id = fields.Many2one("mrp.bom", string="Bill of Materials", required=True, ondelete="cascade")
    name = fields.Char(string="Operation", required=True, default="Operation")
    sequence = fields.Integer(string="Sequence", default=10)
    workcenter_id = fields.Many2one("mrp.workcenter", string="Work Center", ondelete="set null")
    time_cycle_manual = fields.Float(string="Duration (minutes)", default=0.0)
