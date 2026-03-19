"""PO picking inherits project (Odoo project_purchase_stock parity)."""

from core.orm import Model


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    def _prepare_picking(self):
        res = {}
        rows = self.read(["project_id"])
        pid = rows[0].get("project_id") if rows else None
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if pid:
            res["project_id"] = pid
        return res
