"""Extend sale.order with purchase order bridge for sale_purchase."""

from core.orm import Model, api, fields


class PurchaseOrderOrigin(Model):
    _inherit = "purchase.order"

    origin = fields.Char(string="Source Document", copy=False)


class SaleOrderPurchase(Model):
    _inherit = "sale.order"

    purchase_order_count = fields.Integer(
        string="Number of Purchase Orders",
        compute="_compute_purchase_order_count",
    )

    @api.depends("order_line.purchase_line_ids.order_id")
    def _compute_purchase_order_count(self):
        for order in self:
            if not order.order_line:
                order.purchase_order_count = 0
                continue
            po_ids = set()
            for line in order.order_line:
                if not line.purchase_line_ids:
                    continue
                for pl in line.purchase_line_ids:
                    oid = pl.read(["order_id"])[0].get("order_id")
                    if isinstance(oid, (list, tuple)) and oid:
                        oid = oid[0]
                    if oid:
                        po_ids.add(oid)
            order.purchase_order_count = len(po_ids)

    def action_confirm(self):
        result = super().action_confirm()
        if self.order_line:
            self.order_line._purchase_service_generation()
        return result

    def action_view_purchase_orders(self):
        """Return action to view purchase orders generated from this sale order."""
        self.ensure_one()
        po_ids = []
        for line in self.order_line or []:
            if not line.purchase_line_ids:
                continue
            for pl in line.purchase_line_ids:
                oid = pl.read(["order_id"])[0].get("order_id")
                if isinstance(oid, (list, tuple)) and oid:
                    oid = oid[0]
                if oid and oid not in po_ids:
                    po_ids.append(oid)
        action = {
            "type": "ir.actions.act_window",
            "name": "Purchase Orders",
            "res_model": "purchase.order",
            "view_mode": "list,form",
        }
        if len(po_ids) == 1:
            action["view_mode"] = "form"
            action["res_id"] = po_ids[0]
        else:
            action["domain"] = [("id", "in", po_ids)]
        return action
