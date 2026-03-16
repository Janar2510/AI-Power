"""Extend sale.order with invoicing (Phase 118)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    invoice_status = fields.Selection(
        selection=[
            ("no", "Nothing to Invoice"),
            ("to_invoice", "To Invoice"),
            ("invoiced", "Fully Invoiced"),
        ],
        string="Invoice Status",
        default="no",
    )

    def action_confirm(self):
        """Confirm order; create delivery picking if stock; set invoice_status to_invoice."""
        self.write({"state": "sale"})
        if hasattr(self, "_create_delivery_picking"):
            self._create_delivery_picking()
        self.write({"invoice_status": "to_invoice"})

    def action_create_invoice(self):
        """Create customer invoice (account.move) from sale order."""
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
            existing = Move.search([
                ("invoice_origin", "=", order_name),
                ("move_type", "=", "out_invoice"),
            ], limit=1)
            if existing.ids:
                continue
            IrSequence = self.env.get("ir.sequence")
            next_val = IrSequence.next_by_code("account.move") if IrSequence else None
            move_name = f"INV/{next_val:05d}" if next_val is not None else "New"
            order_data = order.read(["partner_id", "currency_id", "date_order"])[0] if order.ids else {}
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
            move_vals = {
                "name": move_name,
                "journal_id": sale_journal.ids[0],
                "partner_id": partner_id,
                "currency_id": move_currency_id,
                "move_type": "out_invoice",
                "invoice_origin": order_name,
                "state": "draft",
            }
            move = Move.create(move_vals)
            if not move.ids:
                continue
            SaleLine = self.env.get("sale.order.line")
            if not SaleLine or not order.id:
                continue
            lines = SaleLine.search([("order_id", "=", order.id)])
            total = 0.0
            total_fc = 0.0
            Currency = self.env.get("res.currency")
            for line in lines:
                line_data = line.read(["product_id", "product_uom_qty", "price_unit", "price_subtotal", "name"])
                if not line_data:
                    continue
                row = line_data[0]
                amount_fc = row.get("price_subtotal") or (row.get("product_uom_qty", 0) * row.get("price_unit", 0))
                if amount_fc <= 0:
                    continue
                amount_cc = amount_fc
                if order_currency_id and company_currency_id and order_currency_id != company_currency_id and Currency:
                    amount_cc = Currency.convert(amount_fc, order_currency_id, company_currency_id, order_date)
                total += amount_cc
                total_fc += amount_fc
                line_vals = {
                    "move_id": move.ids[0],
                    "account_id": income_account.ids[0],
                    "name": row.get("name") or "Sales",
                    "debit": 0.0,
                    "credit": amount_cc,
                    "partner_id": partner_id,
                }
                if order_currency_id and order_currency_id != company_currency_id:
                    line_vals["amount_currency"] = amount_fc
                    line_vals["currency_id"] = order_currency_id
                MoveLine.create(line_vals)
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
            order.write({"invoice_status": "invoiced"})
        return True
