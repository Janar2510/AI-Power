"""Manufacturing Order (Phase 153)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _name = "mrp.production"
    _description = "Manufacturing Order"

    name = fields.Char(string="Reference", readonly=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    bom_id = fields.Many2one("mrp.bom", string="Bill of Materials")
    product_qty = fields.Float(string="Quantity", default=1.0)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("progress", "In Progress"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
        readonly=True,
    )
    date_start = fields.Datetime(string="Start Date")
    date_finished = fields.Datetime(string="Finished Date")
    move_ids = fields.One2many("stock.move", "production_id", string="Moves")
    workorder_ids = fields.One2many("mrp.workorder", "production_id", string="Work Orders")
    origin_sale_line_id = fields.Many2one(
        "sale.order.line",
        string="Sales Order Line",
        ondelete="set null",
        copy=False,
    )

    @classmethod
    def _create_mrp_production_record(cls, vals):
        """Insert MO row after optional name from sequence (Phase 484: merge-safe for `_inherit` create)."""
        if not vals.get("name") or vals.get("name") == "New":
            env = getattr(cls._registry, "_env", None)
            if env:
                seq = env.get("ir.sequence")
                if seq:
                    next_val = seq.next_by_code("mrp.production")
                    if next_val is not None:
                        vals = dict(vals, name=f"MO/{next_val:05d}")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_mrp_production_record(vals)

    def action_confirm(self):
        """Create stock moves for raw materials and finished goods."""
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state != "draft":
                continue
            env = getattr(rec, "env", None)
            if not env:
                continue
            Location = env.get("stock.location")
            Move = env.get("stock.move")
            if not Location or not Move:
                continue
            # Get stock (internal) and production locations
            stock_locs = Location.search([("type", "=", "internal")], limit=2)
            prod_locs = Location.search([("type", "=", "production")], limit=1)
            if not stock_locs.ids:
                continue
            stock_id = stock_locs.ids[0]
            if prod_locs.ids:
                prod_id = prod_locs.ids[0]
            elif len(stock_locs.ids) >= 2:
                prod_id = stock_locs.ids[1]  # Use second internal as WIP fallback
            else:
                continue
            # Raw materials: internal -> production
            rec_data = rec.read(["bom_id", "product_id", "product_qty", "name"])[0]
            bom_id = rec_data.get("bom_id")
            if isinstance(bom_id, (list, tuple)) and bom_id:
                bom_id = bom_id[0]
            prod_name = rec_data.get("name") or "New"
            if bom_id:
                Bom = env.get("mrp.bom")
                bom_data = Bom.browse(bom_id).read(["bom_line_ids"])[0]
                line_ids = bom_data.get("bom_line_ids") or []
                if line_ids and isinstance(line_ids[0], (list, tuple)):
                    line_ids = [x[0] for x in line_ids if x]
                for lid in line_ids or []:
                    line = env.get("mrp.bom.line").browse(lid)
                    line_vals = line.read(["product_id", "product_qty"])[0]
                    pid = line_vals.get("product_id")
                    rec_qty = rec_data.get("product_qty", 1)
                    qty = line_vals.get("product_qty", 1) * rec_qty
                    if isinstance(pid, (list, tuple)):
                        pid = pid[0] if pid else None
                    if pid:
                        Move.create({
                            "name": f"MO {prod_name}",
                            "product_id": pid,
                            "product_uom_qty": qty,
                            "location_id": stock_id,
                            "location_dest_id": prod_id,
                            "state": "draft",
                            "production_id": rec.ids[0] if rec.ids else None,
                        })
            # Finished product: production -> internal
            prod_id_val = rec_data.get("product_id")
            product_id = prod_id_val[0] if isinstance(prod_id_val, (list, tuple)) and prod_id_val else prod_id_val
            Move.create({
                "name": f"MO {prod_name}",
                "product_id": product_id,
                "product_uom_qty": rec_data.get("product_qty", 1),
                "location_id": prod_id,
                "location_dest_id": stock_id,
                "state": "draft",
                "production_id": rec.ids[0] if rec.ids else None,
            })
            rec.write({"state": "confirmed"})
            rec._mrp_create_workorders()
            rec._mrp_reserve_component_moves()
        return True

    def _mrp_create_workorders(self):
        """Work orders from BOM operations (sequence); else single default WO — Phase 490/526."""
        env = getattr(self, "env", None)
        if not env:
            return
        Wo = env.get("mrp.workorder")
        Wc = env.get("mrp.workcenter")
        Bom = env.get("mrp.bom")
        if not Wo:
            return
        for rec in self:
            if not rec.ids:
                continue
            existing = Wo.search([("production_id", "=", rec.ids[0])])
            if existing.ids:
                continue
            row = rec.read(["name", "bom_id"])[0]
            bom_ref = row.get("bom_id")
            bom_id = bom_ref[0] if isinstance(bom_ref, (list, tuple)) and bom_ref else bom_ref
            op_rows = []
            if bom_id and Bom:
                bom_data = Bom.browse(bom_id).read(["operation_ids", "name"])[0]
                oids = bom_data.get("operation_ids") or []
                if oids and isinstance(oids[0], (list, tuple)):
                    oids = [x[0] for x in oids if x]
                OpModel = env.get("mrp.bom.operation")
                if OpModel and oids:
                    for oid in sorted(
                        oids,
                        key=lambda x: OpModel.browse(x).read(["sequence"])[0].get("sequence") or 0,
                    ):
                        op_rows.append(
                            OpModel.browse(oid).read(["id", "name", "workcenter_id", "sequence"])[0]
                        )
            if op_rows:
                for opr in op_rows:
                    wc_val = opr.get("workcenter_id")
                    wc_id = wc_val[0] if isinstance(wc_val, (list, tuple)) and wc_val else wc_val
                    if not wc_id and Wc:
                        wcs = Wc.search([], limit=1)
                        wc_id = wcs.ids[0] if wcs.ids else None
                    Wo.create({
                        "name": str(opr.get("name") or "Operation"),
                        "production_id": rec.ids[0],
                        "workcenter_id": wc_id,
                        "bom_operation_id": opr.get("id"),
                        "state": "pending",
                    })
                continue
            wc_id = None
            if Wc:
                wcs = Wc.search([], limit=1)
                if wcs.ids:
                    wc_id = wcs.ids[0]
            op_name = "Manufacture"
            if isinstance(bom_ref, (list, tuple)) and bom_ref:
                bom_row = Bom.browse(bom_ref[0]).read(["name"]) if Bom else []
                if bom_row and bom_row[0].get("name"):
                    op_name = str(bom_row[0]["name"])
            Wo.create({
                "name": op_name,
                "production_id": rec.ids[0],
                "workcenter_id": wc_id,
                "state": "pending",
            })

    def _mrp_reserve_component_moves(self):
        """Reserve component moves from internal stock when quants allow (Phase 490)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Move = env.get("stock.move")
        Quant = env.get("stock.quant")
        Location = env.get("stock.location")
        if not Move or not Quant or not Location:
            return
        for rec in self:
            if not rec.ids:
                continue
            md = rec.read(["move_ids"])[0]
            mids = md.get("move_ids") or []
            if mids and isinstance(mids[0], (list, tuple)):
                mids = [x[0] for x in mids if x]
            else:
                mids = [x for x in mids if isinstance(x, int)]
            for mid in mids:
                data = Move.browse(mid).read(
                    ["product_id", "product_uom_qty", "location_id", "location_dest_id", "state"]
                )[0]
                if data.get("state") != "draft":
                    continue
                src = data.get("location_id")
                dst = data.get("location_dest_id")
                src_id = src[0] if isinstance(src, (list, tuple)) and src else src
                dst_id = dst[0] if isinstance(dst, (list, tuple)) and dst else dst
                st_src = Location.browse(src_id).read(["type"])[0].get("type") if src_id else None
                st_dst = Location.browse(dst_id).read(["type"])[0].get("type") if dst_id else None
                if st_src != "internal" or st_dst != "production":
                    continue
                pid = data.get("product_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if not pid:
                    continue
                qty_need = float(data.get("product_uom_qty") or 0)
                if qty_need <= 0:
                    continue
                quants = Quant.search([("product_id", "=", pid), ("location_id", "=", src_id)])
                avail = 0.0
                for q in quants:
                    qr = q.read(["quantity", "reserved_quantity"])[0]
                    avail += max(0.0, float(qr.get("quantity") or 0) - float(qr.get("reserved_quantity") or 0))
                if avail < qty_need:
                    continue
                remaining = qty_need
                for q in quants:
                    if remaining <= 0:
                        break
                    qr = q.read(["quantity", "reserved_quantity"])[0]
                    free = max(0.0, float(qr.get("quantity") or 0) - float(qr.get("reserved_quantity") or 0))
                    take = min(remaining, free)
                    if take > 0:
                        q.write({"reserved_quantity": float(qr.get("reserved_quantity") or 0) + take})
                        remaining -= take
                Move.browse(mid).write({"state": "assigned"})

    def _mrp_apply_done_moves_to_quants(self):
        """Consume components and receive finished goods into stock (Phase 490)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Move = env.get("stock.move")
        Quant = env.get("stock.quant")
        Location = env.get("stock.location")
        if not Move or not Quant or not Location:
            return
        for rec in self:
            if not rec.ids:
                continue
            md = rec.read(["move_ids"])[0]
            mids = md.get("move_ids") or []
            if mids and isinstance(mids[0], (list, tuple)):
                mids = [x[0] for x in mids if x]
            else:
                mids = [x for x in mids if isinstance(x, int)]
            for mid in mids:
                data = Move.browse(mid).read(
                    [
                        "product_id",
                        "product_uom_qty",
                        "location_id",
                        "location_dest_id",
                        "state",
                    ]
                )[0]
                if data.get("state") == "cancel":
                    continue
                src = data.get("location_id")
                dst = data.get("location_dest_id")
                src_id = src[0] if isinstance(src, (list, tuple)) and src else src
                dst_id = dst[0] if isinstance(dst, (list, tuple)) and dst else dst
                st_src = Location.browse(src_id).read(["type"])[0].get("type") if src_id else None
                st_dst = Location.browse(dst_id).read(["type"])[0].get("type") if dst_id else None
                pid = data.get("product_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if not pid:
                    continue
                qty = float(data.get("product_uom_qty") or 0)
                if st_src == "internal" and st_dst == "production":
                    if data.get("state") != "assigned":
                        Move.browse(mid).write({"state": "done"})
                        continue
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
                    Move.browse(mid).write({"state": "done"})
                elif st_src == "production" and st_dst == "internal":
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
                    Move.browse(mid).write({"state": "done"})
                else:
                    Move.browse(mid).write({"state": "done"})

    def action_start(self):
        env = getattr(self, "env", None)
        Wo = env.get("mrp.workorder") if env else None
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state == "confirmed":
                rec.write({"state": "progress"})
                if Wo and rec.ids:
                    wos = Wo.search(
                        [("production_id", "=", rec.ids[0]), ("state", "=", "pending")]
                    )
                    if wos.ids:
                        wos.write({"state": "progress"})
        return True

    def action_done(self):
        """Validate moves, update quants, complete work orders."""
        env = getattr(self, "env", None)
        Wo = env.get("mrp.workorder") if env else None
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state != "progress":
                continue
            rec._mrp_apply_done_moves_to_quants()
            if Wo and rec.ids:
                wos = Wo.search(
                    [
                        ("production_id", "=", rec.ids[0]),
                        ("state", "in", ["pending", "progress"]),
                    ]
                )
                if wos.ids:
                    wos.write({"state": "done"})
            rec.write({"state": "done"})
        return True

    def _cancel_open_production_moves(self):
        """Cancel draft/assigned stock moves linked to these MOs (Phase 489)."""
        env = getattr(self, "env", None)
        Move = env.get("stock.move") if env else None
        if not Move:
            return True
        for rec in self:
            if not rec.ids:
                continue
            moves = Move.search(
                [
                    ("production_id", "=", rec.ids[0]),
                    ("state", "in", ["draft", "assigned"]),
                ]
            )
            if moves.ids:
                moves.write({"state": "cancel"})
        return True

    def action_cancel(self):
        env = getattr(self, "env", None)
        MO = env.get("mrp.production") if env else None
        Wo = env.get("mrp.workorder") if env else None
        if MO is not None:
            MO._cancel_open_production_moves(self)
        for rec in self:
            if Wo and rec.ids:
                wos = Wo.search(
                    [
                        ("production_id", "=", rec.ids[0]),
                        ("state", "in", ["pending", "progress"]),
                    ]
                )
                if wos.ids:
                    wos.write({"state": "cancel"})
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state in ("draft", "confirmed", "progress"):
                rec.write({"state": "cancel"})
        return True
