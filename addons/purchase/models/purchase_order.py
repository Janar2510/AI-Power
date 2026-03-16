"""Purchase order (Phase 117)."""

from core.orm import Model, fields


class PurchaseOrder(Model):
    _name = "purchase.order"
    _description = "Purchase Order"

    name = fields.Char(string="Order Reference", required=True, default="New")

    @classmethod
    def create(cls, vals):
        if vals.get("name") == "New" or not vals.get("name"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("purchase.order") if IrSequence else None
            vals = dict(vals, name=f"PO/{next_val:05d}" if next_val is not None else "New")
        return super().create(vals)
    partner_id = fields.Many2one("res.partner", string="Vendor", required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("purchase", "Purchase Order"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
    order_line = fields.One2many(
        "purchase.order.line",
        "order_id",
        string="Order Lines",
    )

    def button_confirm(self):
        """Confirm order and create incoming stock.picking."""
        self.write({"state": "purchase"})
        self._create_incoming_picking()

    def action_cancel(self):
        """Cancel the order."""
        self.write({"state": "cancel"})

    def _create_incoming_picking(self):
        """Create stock.picking (receipt) for each confirmed purchase order."""
        for order in self:
            state_val = order.read(["state"])[0].get("state", "") if order.ids else ""
            if state_val != "purchase":
                continue
            PickingType = self.env.get("stock.picking.type")
            if not PickingType:
                continue
            in_type = PickingType.search([("code", "=", "incoming")], limit=1)
            if not in_type.ids:
                continue
            Picking = self.env.get("stock.picking")
            Move = self.env.get("stock.move")
            if not Picking or not Move:
                continue
            in_type_rec = PickingType.browse(in_type.ids[0]).read(
                ["default_location_src_id", "default_location_dest_id"]
            )
            if not in_type_rec:
                continue
            src_id = in_type_rec[0].get("default_location_src_id")
            dest_id = in_type_rec[0].get("default_location_dest_id")
            if not src_id or not dest_id:
                continue
            order_name_val = order.read(["name"])[0].get("name", "") if order.ids else ""
            existing = Picking.search([
                ("origin", "=", order_name_val),
                ("picking_type_id", "=", in_type.ids[0]),
            ], limit=1)
            if existing.ids:
                continue
            IrSequence = self.env.get("ir.sequence")
            next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
            name = f"IN/{next_val}" if next_val is not None else "New"
            picking_vals = {
                "name": name,
                "picking_type_id": in_type.ids[0],
                "partner_id": order.read(["partner_id"])[0].get("partner_id") if order.ids else None,
                "location_id": src_id,
                "location_dest_id": dest_id,
                "origin": order_name_val,
                "state": "draft",
            }
            picking = Picking.create(picking_vals)
            if not picking.ids:
                continue
            PoLine = self.env.get("purchase.order.line")
            if not PoLine or not order.id:
                continue
            lines = PoLine.search([("order_id", "=", order.id)])
            for line in lines:
                line_data = line.read(["product_id", "product_qty", "name"])[0] if line.ids else {}
                pid = line_data.get("product_id")
                if not pid:
                    continue
                qty = line_data.get("product_qty", 0)
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
