"""Extend sale.order to create stock picking on confirm (Phase 116)."""

from core.orm import Model, api


class SaleOrder(Model):
    _inherit = "sale.order"

    def action_confirm(self):
        """Confirm order and create delivery picking when stock module is installed."""
        self.write({"state": "sale"})
        self._create_delivery_picking()

    def _create_delivery_picking(self):
        """Create stock.picking (delivery order) for each confirmed sale order."""
        for order in self:
            state_val = order.read(["state"])[0].get("state", "") if order.ids else ""
            if state_val != "sale":
                continue
            PickingType = self.env.get("stock.picking.type")
            if not PickingType:
                continue
            out_type = PickingType.search([("code", "=", "outgoing")], limit=1)
            if not out_type.ids:
                continue
            try:
                Picking = self.env.get("stock.picking")
                Move = self.env.get("stock.move")
                Location = self.env.get("stock.location")
            except (KeyError, AttributeError):
                continue
            if not Picking or not Move or not Location:
                continue
            out_type_rec = PickingType.browse(out_type.ids[0]).read(
                ["default_location_src_id", "default_location_dest_id"]
            )
            if not out_type_rec:
                continue
            src_id = out_type_rec[0].get("default_location_src_id")
            dest_id = out_type_rec[0].get("default_location_dest_id")
            if not src_id or not dest_id:
                continue
            order_name_val = order.read(["name"])[0].get("name", "") if order.ids else ""
            existing = Picking.search([
                ("origin", "=", order_name_val),
                ("picking_type_id", "=", out_type.ids[0]),
            ], limit=1)
            if existing.ids:
                continue  # already created for this order
            IrSequence = self.env.get("ir.sequence")
            next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
            name = f"OUT/{next_val}" if next_val is not None else "New"
            partner_val = order.read(["partner_id"])[0].get("partner_id") if order.ids else None
            partner_id = partner_val[0] if isinstance(partner_val, (list, tuple)) and partner_val else partner_val
            picking_vals = {
                "name": name,
                "picking_type_id": out_type.ids[0],
                "partner_id": partner_id,
                "location_id": src_id,
                "location_dest_id": dest_id,
                "origin": order_name_val,
                "sale_id": order.ids[0] if order.ids else None,
                "state": "draft",
            }
            picking = Picking.create(picking_vals)
            if not picking.ids:
                continue
            SaleLine = self.env.get("sale.order.line")
            if not SaleLine or not order.id:
                continue
            lines = SaleLine.search([("order_id", "=", order.id)])
            for line in lines:
                line_data = line.read(["product_id", "product_uom_qty", "name"])[0] if line.ids else {}
                pid = line_data.get("product_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if not pid:
                    continue
                qty = line_data.get("product_uom_qty", 0)
                prod_name = line_data.get("name") or "Product"
                Move.create({
                    "name": prod_name,
                    "product_id": pid,
                    "product_uom_qty": qty,
                    "picking_id": picking.ids[0],
                    "location_id": src_id,
                    "location_dest_id": dest_id,
                    "state": "draft",
                })
        return True
