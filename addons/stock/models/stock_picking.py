"""Stock picking / transfer (Phase 116, Phase 525 lifecycle)."""

from core.orm import Model, fields


def _stock_picking_run_action_validate(picking_rs):
    """Complete transfer(s): quants, moves, picking done. Callable from `stock_account` without broken `super()`."""
    for rec in picking_rs:
        st = rec.read(["state"])[0].get("state") if rec.ids else None
        if st not in ("draft", "assigned"):
            continue
        code = rec._picking_type_code()
        md = rec.read(["move_ids"])[0]
        mids = md.get("move_ids") or []
        if mids and isinstance(mids[0], (list, tuple)):
            mids = [x[0] for x in mids if x]
        env = getattr(rec, "env", None)
        Move = env.get("stock.move") if env else None
        if not Move:
            continue
        if code == "incoming":
            for mid in mids:
                mst = Move.browse(mid).read(["state"])[0].get("state")
                if mst == "cancel":
                    continue
                rec._apply_done_incoming_move(mid)
                Move.browse(mid).write({"state": "done"})
        else:
            for mid in mids:
                mst = Move.browse(mid).read(["state"])[0].get("state")
                if mst == "cancel":
                    continue
                if mst == "draft":
                    rec._reserve_move_from_quants(Move.browse(mid))
                rec._apply_done_outgoing_move(mid)
        rec.write({"state": "done"})
    return True


class StockPicking(Model):
    _name = "stock.picking"
    _description = "Transfer"

    name = fields.Char(string="Reference", required=True, default="New")
    picking_type_id = fields.Many2one("stock.picking.type", string="Operation Type", required=True)
    partner_id = fields.Many2one("res.partner", string="Partner")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    location_dest_id = fields.Many2one("stock.location", string="Destination Location", required=True)
    move_ids = fields.One2many(
        "stock.move",
        "picking_id",
        string="Moves",
    )
    origin = fields.Char(string="Source")
    sale_id = fields.Many2one("sale.order", string="Sale Order")  # Phase 196

    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("assigned", "Available"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )

    @classmethod
    def _create_stock_picking_record(cls, vals):
        """Name from sequence + ORM insert (merge-safe for `_inherit` create)."""
        if vals.get("name") == "New" or not vals.get("name"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
            vals = dict(vals, name=("OUT/%s" % next_val) if next_val is not None else "New")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_stock_picking_record(vals)

    def _picking_type_code(self):
        """Return 'incoming' / 'outgoing' / other from picking type."""
        env = getattr(self, "env", None)
        if not env or not self.ids:
            return None
        row = self.read(["picking_type_id"])[0]
        pt = row.get("picking_type_id")
        pid = pt[0] if isinstance(pt, (list, tuple)) and pt else pt
        if not pid:
            return None
        Pt = env.get("stock.picking.type")
        if not Pt:
            return None
        pr = Pt.browse(pid).read(["code"])[0]
        return pr.get("code") or ""

    def _reserve_move_from_quants(self, move_rec):
        """Reserve full demand on move from quants at source; set move assigned. Returns True if fully reserved."""
        env = getattr(self, "env", None)
        Move = env.get("stock.move") if env else None
        Quant = env.get("stock.quant") if env else None
        Location = env.get("stock.location") if env else None
        if not Move or not Quant or not Location:
            return False
        mid = move_rec.ids[0] if move_rec.ids else None
        if not mid:
            return False
        data = Move.browse(mid).read(
            ["product_id", "product_uom_qty", "location_id", "location_dest_id", "state"]
        )[0]
        if data.get("state") != "draft":
            return data.get("state") == "assigned"
        src = data.get("location_id")
        dst = data.get("location_dest_id")
        src_id = src[0] if isinstance(src, (list, tuple)) and src else src
        dst_id = dst[0] if isinstance(dst, (list, tuple)) and dst else dst
        st_src = Location.browse(src_id).read(["type"])[0].get("type") if src_id else None
        st_dst = Location.browse(dst_id).read(["type"])[0].get("type") if dst_id else None
        if st_src != "internal" or st_dst not in ("customer", "internal", "inventory"):
            return False
        pid = data.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if not pid:
            return False
        qty_need = float(data.get("product_uom_qty") or 0)
        if qty_need <= 0:
            return False
        quants = Quant.search([("product_id", "=", pid), ("location_id", "=", src_id)])
        avail = 0.0
        for q in quants:
            qr = q.read(["quantity", "reserved_quantity"])[0]
            avail += max(0.0, float(qr.get("quantity") or 0) - float(qr.get("reserved_quantity") or 0))
        reserve_target = min(avail, qty_need)
        if reserve_target <= 0:
            Move.browse(mid).write({"quantity_reserved": 0.0, "state": "draft"})
            return False
        remaining = reserve_target
        for q in quants:
            if remaining <= 0:
                break
            qr = q.read(["quantity", "reserved_quantity"])[0]
            free = max(0.0, float(qr.get("quantity") or 0) - float(qr.get("reserved_quantity") or 0))
            take = min(remaining, free)
            if take > 0:
                q.write({"reserved_quantity": float(qr.get("reserved_quantity") or 0) + take})
                remaining -= take
        if reserve_target >= qty_need - 1e-9:
            Move.browse(mid).write({"quantity_reserved": qty_need, "state": "assigned"})
            return True
        Move.browse(mid).write({"quantity_reserved": reserve_target, "state": "partial"})
        return False

    def action_assign(self):
        """Try to reserve stock for draft moves (outgoing from internal)."""
        for rec in self:
            st = rec.read(["state"])[0].get("state") if rec.ids else None
            if st not in ("draft", "assigned"):
                continue
            code = rec._picking_type_code()
            if code != "outgoing":
                continue
            md = rec.read(["move_ids"])[0]
            mids = md.get("move_ids") or []
            if mids and isinstance(mids[0], (list, tuple)):
                mids = [x[0] for x in mids if x]
            Move = getattr(rec, "env", None).get("stock.move") if getattr(rec, "env", None) else None
            if not Move:
                continue
            all_ready = True
            any_move = False
            for mid in mids:
                m = Move.browse(mid)
                row = m.read(["state"])[0]
                st_m = row.get("state")
                if st_m == "cancel":
                    continue
                any_move = True
                if st_m == "draft":
                    rec._reserve_move_from_quants(m)
                    row = m.read(["state"])[0]
                    st_m = row.get("state")
                if st_m not in ("assigned", "partial"):
                    all_ready = False
            if any_move and all_ready:
                rec.write({"state": "assigned"})
        return True

    def _apply_done_incoming_move(self, move_id):
        """Receive product into destination quants."""
        env = getattr(self, "env", None)
        Move = env.get("stock.move") if env else None
        Quant = env.get("stock.quant") if env else None
        if not Move or not Quant:
            return
        data = Move.browse(move_id).read(
            ["product_id", "product_uom_qty", "location_dest_id", "state"]
        )[0]
        if data.get("state") == "cancel":
            return
        pid = data.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        dst = data.get("location_dest_id")
        dst_id = dst[0] if isinstance(dst, (list, tuple)) and dst else dst
        qty = float(data.get("product_uom_qty") or 0)
        if not pid or not dst_id or qty <= 0:
            return
        existing = Quant.search([("product_id", "=", pid), ("location_id", "=", dst_id)], limit=1)
        if existing.ids:
            er = existing.read(["quantity"])[0]
            existing.write({"quantity": float(er.get("quantity") or 0) + qty})
        else:
            Quant.create({
                "product_id": pid,
                "location_id": dst_id,
                "quantity": qty,
                "reserved_quantity": 0.0,
            })

    def _apply_done_outgoing_move(self, move_id):
        """Consume from source quants; supports assigned (reserved) or draft (no stock: done only)."""
        env = getattr(self, "env", None)
        Move = env.get("stock.move") if env else None
        Quant = env.get("stock.quant") if env else None
        Location = env.get("stock.location") if env else None
        if not Move or not Quant or not Location:
            Move.browse(move_id).write({"state": "done"})
            return
        data = Move.browse(move_id).read(
            ["product_id", "product_uom_qty", "quantity_reserved", "location_id", "state"]
        )[0]
        if data.get("state") == "cancel":
            return
        src = data.get("location_id")
        src_id = src[0] if isinstance(src, (list, tuple)) and src else src
        pid = data.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        qty_dem = float(data.get("product_uom_qty") or 0)
        qty_res = float(data.get("quantity_reserved") or 0)
        st_m = data.get("state")
        if st_m in ("assigned", "partial") and qty_res > 0:
            qty = min(qty_dem, qty_res)
        else:
            qty = qty_dem
        if st_m in ("assigned", "partial") and src_id and pid and qty > 0:
            remaining = qty
            quants = Quant.search([("product_id", "=", pid), ("location_id", "=", src_id)])
            for q in quants:
                if remaining <= 0:
                    break
                qr = q.read(["quantity", "reserved_quantity"])[0]
                q_qty = float(qr.get("quantity") or 0)
                q_res = float(qr.get("reserved_quantity") or 0)
                take = min(remaining, q_qty)
                new_qty = max(0.0, q_qty - take)
                new_res = max(0.0, q_res - take)
                q.write({"quantity": new_qty, "reserved_quantity": new_res})
                remaining -= take
        # Shrink demand to shipped qty so valuation / move lines stay consistent (Phase 530).
        if qty < qty_dem:
            Move.browse(move_id).write({"product_uom_qty": qty, "quantity_reserved": 0.0, "state": "done"})
        else:
            Move.browse(move_id).write({"quantity_reserved": 0.0, "state": "done"})

    def action_validate(self):
        """Complete transfer: update quants, set moves and picking done (Phase 525)."""
        return _stock_picking_run_action_validate(self)

    def action_confirm(self):
        """Backward-compatible alias: validate the transfer (tests + UI)."""
        return self.action_validate()
