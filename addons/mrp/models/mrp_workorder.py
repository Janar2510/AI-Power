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

    def action_start(self):
        """Mark work order in progress (Phase B3)."""
        for wo in self:
            if wo.read(["state"])[0].get("state") == "pending":
                wo.write({"state": "progress"})
        return True

    def action_done(self):
        """Mark work order done (Phase B3)."""
        for wo in self:
            st = wo.read(["state"])[0].get("state")
            if st in ("pending", "progress"):
                wo.write({"state": "done"})
        return True

    def action_cancel(self):
        """Cancel work order (Phase B3)."""
        for wo in self:
            st = wo.read(["state"])[0].get("state")
            if st != "done":
                wo.write({"state": "cancel"})
        return True
