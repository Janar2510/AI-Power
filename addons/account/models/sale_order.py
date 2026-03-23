"""Extend sale.order with invoicing (Phase 118, 191, 196)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    payment_term_id = fields.Many2one("account.payment.term", string="Payment Terms")  # Phase 191
    invoice_status = fields.Selection(
        selection=[
            ("no", "Nothing to Invoice"),
            ("to_invoice", "To Invoice"),
            ("invoiced", "Fully Invoiced"),
        ],
        string="Invoice Status",
        default="no",
    )
    delivery_status = fields.Selection(
        selection=[
            ("no", "Not Delivered"),
            ("partial", "Partially Delivered"),
            ("full", "Fully Delivered"),
        ],
        string="Delivery Status",
        default="no",
    )  # Phase 196

    def _update_delivery_status(self):
        """Recompute delivery_status from pickings (Phase 196)."""
        Picking = self.env.get("stock.picking")
        Move = self.env.get("stock.move")
        if not Picking or not Move:
            return
        for order in self:
            if not order.ids:
                continue
            pickings = Picking.search([("sale_id", "=", order.ids[0])])
            if not pickings.ids:
                order.write({"delivery_status": "no"})
                continue
            total_demand = 0.0
            total_done = 0.0
            for p in pickings:
                moves = Move.search([("picking_id", "=", p.ids[0])])
                for m in moves:
                    qty = m.read(["product_uom_qty", "state"])[0]
                    total_demand += float(qty.get("product_uom_qty") or 0)
                    if qty.get("state") == "done":
                        total_done += float(qty.get("product_uom_qty") or 0)
            if total_demand <= 0:
                order.write({"delivery_status": "no"})
            elif total_done >= total_demand - 0.01:
                order.write({"delivery_status": "full"})
            elif total_done > 0:
                order.write({"delivery_status": "partial"})
            else:
                order.write({"delivery_status": "no"})

    def action_confirm(self):
        """Confirm order; create delivery picking if stock; set invoice_status to_invoice (Phase 196)."""
        if hasattr(self, "_action_confirm_sale_core"):
            self._action_confirm_sale_core()
        else:
            self.write({"state": "sale"})
        if hasattr(self, "_action_confirm_stock_core"):
            self._action_confirm_stock_core()
        self._action_confirm_account_core()

    def _action_confirm_account_core(self):
        """Accounting confirmation side effects layered onto sale confirmation."""
        self.write({"invoice_status": "to_invoice"})
        self._update_delivery_status()

    def _get_delivered_qty_by_product(self):
        """Return {product_id: delivered_qty} from done moves in pickings (Phase 196)."""
        if not self or not self.ids:
            return {}
        Picking = self.env.get("stock.picking")
        Move = self.env.get("stock.move")
        if not Picking or not Move:
            return {}
        pickings = Picking.search([("sale_id", "=", self.ids[0])])
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

    def _create_invoice_from_picking(self, picking):
        """Create invoice from a specific picking's delivered quantities (Phase 196)."""
        if not picking or not picking.ids:
            return None
        Move = self.env.get("stock.move")
        if not Move:
            return None
        moves = Move.search([("picking_id", "=", picking.ids[0]), ("state", "=", "done")])
        if not moves.ids:
            return None
        delivered_by_product = {}
        for m in moves:
            row = m.read(["product_id", "product_uom_qty"])[0]
            pid = row.get("product_id")
            pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
            if pid:
                delivered_by_product[pid] = delivered_by_product.get(pid, 0) + float(row.get("product_uom_qty") or 0)
        return self._create_invoice_with_quantities(delivered_by_product)

    def _create_invoice_with_quantities(self, qty_by_product=None):
        """Create invoice with given quantities per product, or order qty if None (Phase 196)."""
        for order in self:
            if order.read(["state"])[0].get("state") != "sale":
                continue
            Move = self.env.get("account.move")
            MoveLine = self.env.get("account.move.line")
            Journal = self.env.get("account.journal")
            Account = self.env.get("account.account")
            if not all([Move, MoveLine, Journal, Account]):
                continue
            sale_journal = Journal.search([("type", "=", "sale")], limit=1)
            if not sale_journal.ids:
                continue
            income_account = Account.search([("account_type", "=", "income")], limit=1)
            receivable_account = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not income_account.ids or not receivable_account.ids:
                continue
            order_name = order.read(["name"])[0].get("name", "") if order.ids else ""
            existing = Move.search(
                [
                    ("invoice_origin", "=", order_name),
                    ("move_type", "=", "out_invoice"),
                    ("state", "=", "draft"),
                ],
                limit=1,
            )
            if existing.ids:
                continue
            IrSequence = self.env.get("ir.sequence")
            next_val = IrSequence.next_by_code("account.move") if IrSequence else None
            move_name = f"INV/{next_val:05d}" if next_val is not None else "New"
            order_data = order.read(["partner_id", "currency_id", "date_order", "payment_term_id"])[0] if order.ids else {}
            partner_id = order_data.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            order_currency_id = order_data.get("currency_id")
            if isinstance(order_currency_id, (list, tuple)) and order_currency_id:
                order_currency_id = order_currency_id[0]
            order_date = order_data.get("date_order") or ""
            if order_date and len(str(order_date)) >= 10:
                order_date = str(order_date)[:10]
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
            SaleLine = self.env.get("sale.order.line")
            if not SaleLine or not order.id:
                continue
            lines = SaleLine.search([("order_id", "=", order.id)])
            total = 0.0
            total_fc = 0.0
            Currency = self.env.get("res.currency")
            prepared_line_vals = []
            for line in lines:
                line_data = line.read(["product_id", "product_uom_qty", "price_unit", "price_subtotal", "name"])
                if not line_data:
                    continue
                row = line_data[0]
                pid = row.get("product_id")
                pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
                line_qty = float(row.get("product_uom_qty") or 0)
                if qty_by_product is not None:
                    line_qty = float(qty_by_product.get(pid, 0))
                if line_qty <= 0:
                    continue
                price_unit = float(row.get("price_unit") or 0)
                amount_fc = line_qty * price_unit
                amount_cc = amount_fc
                if order_currency_id and company_currency_id and order_currency_id != company_currency_id and Currency:
                    amount_cc = Currency.convert(amount_fc, order_currency_id, company_currency_id, order_date)
                total += amount_cc
                total_fc += amount_fc
                line_vals = {
                    "account_id": income_account.ids[0],
                    "name": row.get("name") or "Sales",
                    "debit": 0.0,
                    "credit": amount_cc,
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
                "journal_id": sale_journal.ids[0],
                "partner_id": partner_id,
                "currency_id": move_currency_id,
                "move_type": "out_invoice",
                "invoice_origin": order_name,
                "state": "draft",
                "date": order_date or None,
            }
            if pt_id:
                move_vals["payment_term_id"] = pt_id
            move = Move.create(move_vals)
            if not move.ids:
                continue
            for line_vals in prepared_line_vals:
                MoveLine.create(dict(line_vals, move_id=move.ids[0]))
            if total > 0:
                recv_vals = {
                    "move_id": move.ids[0],
                    "account_id": receivable_account.ids[0],
                    "name": "Receivable",
                    "debit": total,
                    "credit": 0.0,
                    "partner_id": partner_id,
                }
                if order_currency_id and company_currency_id and order_currency_id != company_currency_id:
                    recv_vals["amount_currency"] = total_fc
                    recv_vals["currency_id"] = order_currency_id
                MoveLine.create(recv_vals)
            move.write({})  # Trigger recompute of invoice_date_due after lines exist
            order.write({"invoice_status": "invoiced"})
        return True

    def action_create_invoice(self):
        """Create customer invoice. Uses delivered qty when available (Phase 196)."""
        for order in self:
            qty_by_product = order._get_delivered_qty_by_product()
            if qty_by_product and any(q > 0 for q in qty_by_product.values()):
                order._create_invoice_with_quantities(qty_by_product)
            else:
                order._create_invoice_with_quantities(None)
        return True
