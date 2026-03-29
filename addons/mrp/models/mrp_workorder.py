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

    def action_done_with_quant(self):
        """Mark work order done and trigger quant consumption on the parent MO (Track P1).

        If all work orders on the MO are now done, the MO transitions to progress
        and quant updates are applied so stock reflects the completed operation.
        """
        env = getattr(self, "env", None)
        Mo = env.get("mrp.production") if env else None
        Wo = env.get("mrp.workorder") if env else None
        for wo in self:
            st = wo.read(["state"])[0].get("state")
            if st in ("pending", "progress"):
                wo.write({"state": "done"})
            if not Mo or not Wo or not wo.ids:
                continue
            wo_data = wo.read(["production_id"])[0]
            prod_ref = wo_data.get("production_id")
            prod_id = prod_ref[0] if isinstance(prod_ref, (list, tuple)) and prod_ref else prod_ref
            if not prod_id:
                continue
            mo = Mo.browse(prod_id)
            # Check if all WOs on the MO are done
            pending_wos = Wo.search([
                ("production_id", "=", prod_id),
                ("state", "not in", ["done", "cancel"]),
            ])
            if not pending_wos.ids:
                mo_state = mo.read(["state"])[0].get("state")
                if mo_state == "confirmed":
                    mo.write({"state": "progress"})
                    mo_state = "progress"
                if mo_state == "progress":
                    mo._mrp_apply_done_moves_to_quants()
        return True
