"""POS order and order lines (Phase 227)."""

from core.orm import Model, api, fields


class PosOrderLine(Model):
    _name = "pos.order.line"
    _description = "POS Order Line"

    order_id = fields.Many2one("pos.order", string="Order", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    name = fields.Char(string="Description")
    qty = fields.Float(string="Quantity", default=1.0)
    price_unit = fields.Float(string="Unit Price", default=0.0)
    price_subtotal = fields.Computed(compute="_compute_price_subtotal", string="Subtotal")

    @api.depends("qty", "price_unit")
    def _compute_price_subtotal(self):
        if not self:
            return []
        rows = self.read(["qty", "price_unit"])
        return [r.get("qty", 0) * r.get("price_unit", 0) for r in rows]


class PosOrder(Model):
    _name = "pos.order"
    _description = "POS Order"

    name = fields.Char(string="Order", required=True, default="New")
    session_id = fields.Many2one("pos.session", string="Session", required=True)
    partner_id = fields.Many2one("res.partner", string="Customer")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("paid", "Paid"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
    lines = fields.One2many("pos.order.line", "order_id", string="Lines")
    amount_total = fields.Computed(compute="_compute_amount_total", string="Total")
    payment_amount = fields.Float(string="Amount Paid", default=0.0)

    @classmethod
    def _create_pos_order_record(cls, vals):
        """Name from sequence + ORM insert (Phase 486: merge-safe for `_inherit` create)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("pos.order") if IrSequence else None
            vals = dict(vals, name=f"ORD/{next_val:05d}" if next_val is not None else "New")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_pos_order_record(vals)

    @api.depends("lines.price_subtotal")
    def _compute_amount_total(self):
        if not self:
            return []
        result = []
        for rec in self:
            lines = rec.lines
            if not lines:
                result.append(0.0)
                continue
            rows = lines.read(["price_subtotal"])
            result.append(sum(r.get("price_subtotal", 0) for r in rows))
        return result

    def action_pay(self):
        """Mark order as paid."""
        for rec in self:
            total = rec.read(["amount_total"])[0].get("amount_total", 0) if rec.read(["amount_total"]) else 0
            rec.write({"state": "paid", "payment_amount": total})

    def action_done(self):
        """Finalize order: create stock move, journal entry."""
        for rec in self:
            row = rec.read(["state"])[0] if rec.read(["state"]) else {}
            if row.get("state") != "paid":
                continue
            rec._create_stock_moves()
            rec._create_account_move()
            rec.write({"state": "done"})

    def _create_stock_moves(self):
        """Create stock moves for order lines (Phase 227)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Move = env.get("stock.move")
        Location = env.get("stock.location")
        Picking = env.get("stock.picking")
        PickingType = env.get("stock.picking.type")
        if not all([Move, Location, Picking, PickingType]):
            return
        pt_out = PickingType.search([("code", "=", "outgoing")], limit=1)
        if not pt_out.ids:
            pt_out = PickingType.search([], limit=1)
        if not pt_out.ids:
            return
        pt_id = pt_out.ids[0]
        stock_locs = Location.search([("type", "=", "internal")], limit=1)
        cust_locs = Location.search([("type", "=", "customer")], limit=1)
        if not stock_locs.ids or not cust_locs.ids:
            return
        src, dest = stock_locs.ids[0], cust_locs.ids[0]
        for rec in self:
            order_name = rec.read(["name"])[0].get("name", "POS") if rec.read(["name"]) else "POS"
            pick = Picking.create({
                "name": f"POS {order_name}",
                "picking_type_id": pt_id,
                "location_id": src,
                "location_dest_id": dest,
                "origin": order_name,
            })
            lines = rec.lines
            if lines:
                for line in lines:
                    row = line.read(["product_id", "qty"])[0] if line.read(["product_id", "qty"]) else {}
                    pid = row.get("product_id")
                    qty = row.get("qty", 1)
                    if isinstance(pid, (list, tuple)) and pid:
                        pid = pid[0]
                    if pid:
                        Move.create({
                            "name": order_name,
                            "product_id": pid,
                            "product_uom_qty": qty,
                            "location_id": src,
                            "location_dest_id": dest,
                            "picking_id": pick.id,
                        })

    def _create_account_move(self):
        """Create journal entry for payment (Phase 227)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Session = env.get("pos.session")
        Config = env.get("pos.config")
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        Account = env.get("account.account")
        if not all([Session, Config, Move, MoveLine, Account]):
            return
        income = Account.search([("account_type", "=", "income")], limit=1)
        cash = Account.search([("account_type", "=", "asset_cash")], limit=1)
        if not income.ids or not cash.ids:
            return
        for rec in self:
            row = rec.read(["session_id", "partner_id", "amount_total", "name"])[0] if rec.read(["session_id", "partner_id", "amount_total", "name"]) else {}
            session_id = row.get("session_id")
            if isinstance(session_id, (list, tuple)) and session_id:
                session_id = session_id[0]
            if not session_id:
                continue
            sess_row = Session.browse(session_id).read(["config_id"])[0] if Session.browse(session_id) else {}
            config_id = sess_row.get("config_id")
            if isinstance(config_id, (list, tuple)) and config_id:
                config_id = config_id[0]
            if not config_id:
                continue
            cfg_row = Config.browse(config_id).read(["journal_id"])[0] if Config.browse(config_id).ids else {}
            journal_id = cfg_row.get("journal_id")
            if isinstance(journal_id, (list, tuple)) and journal_id:
                journal_id = journal_id[0]
            if not journal_id:
                continue
            amount = row.get("amount_total", 0) or 0
            order_name = row.get("name", "POS")
            partner_id = row.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            move = Move.create({
                "journal_id": journal_id,
                "partner_id": partner_id,
                "move_type": "entry",
                "invoice_origin": order_name,
            })
            MoveLine.create({"move_id": move.id, "account_id": income.ids[0], "credit": amount, "name": f"POS {order_name}"})
            MoveLine.create({"move_id": move.id, "account_id": cash.ids[0], "debit": amount, "name": f"POS {order_name}"})
            move.write({"state": "posted"})
