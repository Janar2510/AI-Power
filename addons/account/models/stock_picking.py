"""Extend stock.picking for sale/purchase delivery and invoicing (Phase 196, 197)."""

from core.orm import Model


class StockPicking(Model):
    _inherit = "stock.picking"

    def action_confirm(self):
        """Validate picking and update sale order delivery_status / purchase order bill_status."""
        for rec in self:
            rec.write({"state": "done"})
            if rec.move_ids:
                rec.move_ids.write({"state": "done"})
        for rec in self:
            sale_id = rec.read(["sale_id"])[0].get("sale_id") if rec.ids else None
            if sale_id:
                sid = sale_id[0] if isinstance(sale_id, (list, tuple)) and sale_id else sale_id
                if sid:
                    SaleOrder = self.env.get("sale.order")
                    if SaleOrder:
                        order = SaleOrder.browse(sid)
                        if order.ids and hasattr(order, "_update_delivery_status"):
                            order._update_delivery_status()
            purchase_id = None
            if rec.ids:
                try:
                    purchase_id = rec.read(["purchase_id"])[0].get("purchase_id")
                except (KeyError, TypeError):
                    pass
            if purchase_id:
                pid = purchase_id[0] if isinstance(purchase_id, (list, tuple)) and purchase_id else purchase_id
                if pid:
                    PurchaseOrder = self.env.get("purchase.order")
                    if PurchaseOrder:
                        order = PurchaseOrder.browse(pid)
                        if order.ids and hasattr(order, "_update_bill_status"):
                            order._update_bill_status()

    def action_create_invoice(self):
        """Create customer invoice from this picking's delivered quantities (Phase 196)."""
        if not self or not self.ids:
            return None
        sale_id = self.read(["sale_id"])[0].get("sale_id") if self.ids else None
        if not sale_id:
            return None
        sid = sale_id[0] if isinstance(sale_id, (list, tuple)) and sale_id else sale_id
        SaleOrder = self.env.get("sale.order")
        if not SaleOrder or not sid:
            return None
        order = SaleOrder.browse(sid)
        return order._create_invoice_from_picking(self)

    def action_create_bill(self):
        """Create vendor bill from this picking's received quantities (Phase 197)."""
        if not self or not self.ids:
            return None
        try:
            purchase_id = self.read(["purchase_id"])[0].get("purchase_id")
        except (KeyError, TypeError):
            return None
        if not purchase_id:
            return None
        pid = purchase_id[0] if isinstance(purchase_id, (list, tuple)) and purchase_id else purchase_id
        PurchaseOrder = self.env.get("purchase.order")
        if not PurchaseOrder or not pid:
            return None
        order = PurchaseOrder.browse(pid)
        return order._create_bill_from_picking(self)
