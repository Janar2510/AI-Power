"""Purchase order (Phase 117, 154)."""

from core.orm import Model, Recordset, api, fields


class PurchaseOrder(Model):
    _name = "purchase.order"
    _description = "Purchase Order"
    _audit = True  # Phase 205

    name = fields.Char(string="Order Reference", required=True, default="New")
    partner_id = fields.Many2one("res.partner", string="Vendor", required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")
    payment_term_id = fields.Many2one("account.payment.term", string="Payment Terms")  # Phase 191
    amount_total = fields.Computed(compute="_compute_amount_total", store=True, string="Total")
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
    bill_status = fields.Selection(
        selection=[
            ("no", "Nothing to Bill"),
            ("partial", "Partially Billed"),
            ("full", "Fully Billed"),
        ],
        string="Bill Status",
        default="no",
    )  # Phase 197

    def _update_bill_status(self):
        """Recompute bill_status from vendor bills (Phase 197)."""
        Move = self.env.get("account.move")
        MoveLine = self.env.get("account.move.line")
        if not Move or not MoveLine:
            return
        for order in self:
            if not order.ids:
                continue
            order_name = order.read(["name"])[0].get("name", "") if order.ids else ""
            bills = Move.search([
                ("invoice_origin", "=", order_name),
                ("move_type", "=", "in_invoice"),
            ])
            if not bills.ids:
                order.write({"bill_status": "no"})
                continue
            total_billed = 0.0
            for bill in bills:
                lines = MoveLine.search([("move_id", "=", bill.ids[0]), ("debit", ">", 0)])
                for ln in lines:
                    row = ln.read(["debit"])[0]
                    total_billed += float(row.get("debit") or 0)
            total_ordered = 0.0
            for line in order.order_line:
                row = line.read(["product_qty", "price_unit"])[0]
                total_ordered += float(row.get("product_qty") or 0) * float(row.get("price_unit") or 0)
            if total_ordered <= 0:
                order.write({"bill_status": "no"})
            elif total_billed >= total_ordered - 0.01:
                order.write({"bill_status": "full"})
            elif total_billed > 0:
                order.write({"bill_status": "partial"})
            else:
                order.write({"bill_status": "no"})

    def _get_received_qty_by_product(self):
        """Return {product_id: received_qty} from done moves in pickings (Phase 197).

        Pickings are matched by ``purchase_id`` or by ``origin`` equal to the PO reference so
        receipts still count when the link field was not set (imports / edge flows).
        """
        if not self or not self.ids:
            return {}
        Picking = self.env.get("stock.picking")
        Move = self.env.get("stock.move")
        if not Picking or not Move:
            return {}
        order_name = self.read(["name"])[0].get("name", "") if self.ids else ""
        if order_name:
            picking_domain = [
                "|",
                ("purchase_id", "=", self.ids[0]),
                ("origin", "=", order_name),
            ]
        else:
            picking_domain = [("purchase_id", "=", self.ids[0])]
        pickings = Picking.search(picking_domain)
        result = {}
        for p in pickings:
            moves = Move.search([("picking_id", "=", p.ids[0]), ("state", "=", "done")])
            for m in moves:
                row = m.read(["product_id", "product_uom_qty"])[0]
                pid = row.get("product_id")
                pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
                if pid:
                    result[pid] = result.get(pid, 0) + float(row.get("product_uom_qty") or 0)
        return result

    def _create_bill_from_picking(self, picking):
        """Create vendor bill from a specific picking's received quantities (Phase 197)."""
        if not picking or not picking.ids:
            return None
        Move = self.env.get("stock.move")
        if not Move:
            return None
        moves = Move.search([("picking_id", "=", picking.ids[0]), ("state", "=", "done")])
        if not moves.ids:
            return None
        received_by_product = {}
        for m in moves:
            row = m.read(["product_id", "product_uom_qty"])[0]
            pid = row.get("product_id")
            pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
            if pid:
                received_by_product[pid] = received_by_product.get(pid, 0) + float(row.get("product_uom_qty") or 0)
        return self._create_bill_with_quantities(received_by_product)

    def _create_bill_with_quantities(self, qty_by_product=None):
        """Create vendor bill with given quantities per product, or order qty if None (Phase 197)."""
        for order in self:
            if order.read(["state"])[0].get("state") != "purchase":
                continue
            Move = self.env.get("account.move")
            MoveLine = self.env.get("account.move.line")
            Journal = self.env.get("account.journal")
            Account = self.env.get("account.account")
            if not all([Move, MoveLine, Journal, Account]):
                continue
            purch_journal = Journal.search([("type", "=", "purchase")], limit=1)
            if not purch_journal.ids:
                continue
            expense_account = Account.search([("account_type", "=", "expense")], limit=1)
            payable_account = Account.search([("account_type", "=", "liability_payable")], limit=1)
            if not expense_account.ids or not payable_account.ids:
                continue
            order_name = order.read(["name"])[0].get("name", "") if order.ids else ""
            existing = Move.search(
                [
                    ("invoice_origin", "=", order_name),
                    ("move_type", "=", "in_invoice"),
                    ("state", "=", "draft"),
                ],
                limit=1,
            )
            if existing.ids:
                continue
            IrSequence = self.env.get("ir.sequence")
            next_val = IrSequence.next_by_code("account.move") if IrSequence else None
            move_name = f"BILL/{next_val:05d}" if next_val is not None else "New"
            order_data = order.read(["partner_id", "currency_id", "payment_term_id"])[0] if order.ids else {}
            partner_id = order_data.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            order_currency_id = order_data.get("currency_id")
            if isinstance(order_currency_id, (list, tuple)) and order_currency_id:
                order_currency_id = order_currency_id[0]
            Company = self.env.get("res.company")
            company_currency_id = None
            if Company:
                companies = Company.search([], limit=1)
                if companies.ids:
                    cdata = Company.browse(companies.ids[0]).read(["currency_id"])[0]
                    company_currency_id = cdata.get("currency_id")
                    if isinstance(company_currency_id, (list, tuple)) and company_currency_id:
                        company_currency_id = company_currency_id[0]
            move_currency_id = order_currency_id or company_currency_id
            pt_id = order_data.get("payment_term_id")
            if isinstance(pt_id, (list, tuple)) and pt_id:
                pt_id = pt_id[0]
            PoLine = self.env.get("purchase.order.line")
            if not PoLine or not order.id:
                continue
            lines = PoLine.search([("order_id", "=", order.id)])
            total = 0.0
            total_fc = 0.0
            Currency = self.env.get("res.currency")
            prepared_line_vals = []
            for line in lines:
                line_data = line.read(["product_id", "product_qty", "price_unit", "name"])
                if not line_data:
                    continue
                row = line_data[0]
                pid = row.get("product_id")
                pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
                line_qty = float(row.get("product_qty") or 0)
                if qty_by_product is not None:
                    line_qty = float(qty_by_product.get(pid, 0))
                if line_qty <= 0:
                    continue
                price_unit = float(row.get("price_unit") or 0)
                amount_fc = line_qty * price_unit
                amount_cc = amount_fc
                if order_currency_id and company_currency_id and order_currency_id != company_currency_id and Currency:
                    amount_cc = Currency.convert(amount_fc, order_currency_id, company_currency_id, None)
                total += amount_cc
                total_fc += amount_fc
                line_vals = {
                    "account_id": expense_account.ids[0],
                    "name": row.get("name") or "Purchases",
                    "debit": amount_cc,
                    "credit": 0.0,
                    "partner_id": partner_id,
                }
                if order_currency_id and order_currency_id != company_currency_id:
                    line_vals["amount_currency"] = amount_fc
                    line_vals["currency_id"] = order_currency_id
                prepared_line_vals.append(line_vals)
            if not prepared_line_vals:
                continue
            move_vals = {
                "name": move_name,
                "journal_id": purch_journal.ids[0],
                "partner_id": partner_id,
                "currency_id": move_currency_id,
                "move_type": "in_invoice",
                "invoice_origin": order_name,
                "state": "draft",
                "date": None,
            }
            if pt_id:
                move_vals["payment_term_id"] = pt_id
            move = Move.create(move_vals)
            if not move.ids:
                continue
            for line_vals in prepared_line_vals:
                MoveLine.create(dict(line_vals, move_id=move.ids[0]))
            if total > 0:
                pay_vals = {
                    "move_id": move.ids[0],
                    "account_id": payable_account.ids[0],
                    "name": "Payable",
                    "debit": 0.0,
                    "credit": total,
                    "partner_id": partner_id,
                }
                if order_currency_id and company_currency_id and order_currency_id != company_currency_id:
                    pay_vals["amount_currency"] = -total_fc
                    pay_vals["currency_id"] = order_currency_id
                MoveLine.create(pay_vals)
            move.write({})
            order._update_bill_status()
        return True

    def action_create_bill(self):
        """Create vendor bill. Uses received qty when available (Phase 197)."""
        for order in self:
            qty_by_product = order._get_received_qty_by_product()
            if qty_by_product and any(q > 0 for q in qty_by_product.values()):
                order._create_bill_with_quantities(qty_by_product)
            else:
                order._create_bill_with_quantities(None)
        return True

    @api.depends("order_line.product_qty", "order_line.price_unit")
    def _compute_amount_total(self):
        if not self:
            return []
        result = []
        for rec in self:
            lines = rec.order_line
            if not lines:
                result.append(0.0)
                continue
            rows = lines.read(["product_qty", "price_unit"])
            total = sum(r.get("product_qty", 0) * r.get("price_unit", 0) for r in rows)
            result.append(total)
        return result

    @classmethod
    def _create_purchase_order_record(cls, vals):
        """Insert PO row after name/currency defaults (Phase 479: same merge-safe pattern as sale.order)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("purchase.order") if IrSequence else None
            vals = dict(vals, name=f"PO/{next_val:05d}" if next_val is not None else "New")
        if env and ("currency_id" not in vals or not vals.get("currency_id")):
            Company = env.get("res.company")
            if Company:
                companies = Company.search([], limit=1)
                if companies.ids:
                    cdata = Company.browse(companies.ids[0]).read(["currency_id"])[0]
                    cid = cdata.get("currency_id")
                    if isinstance(cid, (list, tuple)) and cid:
                        cid = cid[0]
                    if cid:
                        vals = dict(vals, currency_id=cid)
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_purchase_order_record(vals)

    def button_confirm(self):
        """Confirm order and create incoming stock.picking (Phase 197)."""
        if not self:
            return True
        draft_ids = []
        for rec in self:
            rows = rec.read(["state"])
            if rows and rows[0].get("state") == "draft":
                draft_ids.append(rec.ids[0])
        if not draft_ids:
            return True
        _env = getattr(self, "env", None) or getattr(self, "_env", None)
        todo = Recordset(self._model, draft_ids, _env=_env)
        todo.write({"state": "purchase"})
        todo._create_incoming_picking()
        todo._update_bill_status()
        return True

    def _cancel_open_incoming_pickings(self):
        """Cancel draft/assigned incoming pickings tied to these POs (Phase 476)."""
        Picking = self.env.get("stock.picking")
        Move = self.env.get("stock.move")
        PickingType = self.env.get("stock.picking.type")
        if not Picking:
            return True
        open_states = ["draft", "assigned"]
        in_type_id = None
        if PickingType:
            in_type = PickingType.search([("code", "=", "incoming")], limit=1)
            if in_type.ids:
                in_type_id = in_type.ids[0]
        for order in self:
            if not order.ids:
                continue
            order_name = order.read(["name"])[0].get("name", "") if order.ids else ""
            state_leaf = ("state", "in", open_states)
            if in_type_id:
                type_leaf = ("picking_type_id", "=", in_type_id)
                if order_name:
                    link_domain = [
                        "|",
                        ("purchase_id", "=", order.ids[0]),
                        ("origin", "=", order_name),
                    ]
                    domain = ["&", ["&", type_leaf, link_domain], state_leaf]
                else:
                    domain = ["&", ["&", type_leaf, ("purchase_id", "=", order.ids[0])], state_leaf]
            elif order_name:
                link_domain = [
                    "|",
                    ("purchase_id", "=", order.ids[0]),
                    ("origin", "=", order_name),
                ]
                domain = ["&", link_domain, state_leaf]
            else:
                domain = ["&", ("purchase_id", "=", order.ids[0]), state_leaf]
            pickings = Picking.search(domain)
            for picking in pickings:
                picking.write({"state": "cancel"})
                if Move and picking.ids:
                    moves = Move.search(
                        [
                            ("picking_id", "=", picking.ids[0]),
                            ("state", "not in", ["done", "cancel"]),
                        ]
                    )
                    if moves.ids:
                        moves.write({"state": "cancel"})
        return True

    def action_cancel(self):
        """Cancel the order and open incoming receipts."""
        PO = self.env.get("purchase.order") if getattr(self, "env", None) else None
        if PO is not None:
            PO._cancel_open_incoming_pickings(self)
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
            partner_val = order.read(["partner_id"])[0].get("partner_id") if order.ids else None
            partner_id = partner_val[0] if isinstance(partner_val, (list, tuple)) and partner_val else partner_val
            picking_vals = {
                "name": name,
                "picking_type_id": in_type.ids[0],
                "partner_id": partner_id,
                "location_id": src_id,
                "location_dest_id": dest_id,
                "origin": order_name_val,
                "purchase_id": order.ids[0] if order.ids else None,
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
                pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
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
