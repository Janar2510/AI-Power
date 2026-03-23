"""Manufacturing work order (Phase 490 / MRP flow)."""

from core.orm import Model, fields


class MrpWorkorder(Model):
    _name = "mrp.workorder"
    _description = "Manufacturing Work Order"

    name = fields.Char(string="Operation", default="Manufacturing")
    production_id = fields.Many2one(
        "mrp.production",
        string="Manufacturing Order",
        required=True,
        ondelete="cascade",
    )
    bom_operation_id = fields.Many2one(
        "mrp.bom.operation",
        string="BOM Operation",
        ondelete="set null",
        copy=False,
    )
    workcenter_id = fields.Many2one("mrp.workcenter", string="Work Center", ondelete="set null")
    sequence = fields.Integer(string="Sequence", default=10)
    state = fields.Selection(
        selection=[
            ("pending", "Pending"),
            ("progress", "In Progress"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="pending",
    )
