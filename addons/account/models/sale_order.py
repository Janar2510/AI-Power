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
            move_name = f"INV/{next_val}" if next_val is not None else "New"
            partner_id = order.read(["partner_id"])[0].get("partner_id") if order.ids else None
            move_vals = {
                "name": move_name,
                "journal_id": sale_journal.ids[0],
                "partner_id": partner_id,
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
            for line in lines:
                line_data = line.read(["product_id", "product_uom_qty", "price_unit", "price_subtotal", "name"])
                if not line_data:
                    continue
                row = line_data[0]
                amount = row.get("price_subtotal") or (row.get("product_uom_qty", 0) * row.get("price_unit", 0))
                if amount <= 0:
                    continue
                total += amount
                MoveLine.create({
                    "move_id": move.ids[0],
                    "account_id": income_account.ids[0],
                    "name": row.get("name") or "Sales",
                    "debit": 0.0,
                    "credit": amount,
                    "partner_id": partner_id,
                })
            if total > 0:
                MoveLine.create({
                    "move_id": move.ids[0],
                    "account_id": receivable_account.ids[0],
                    "name": "Receivable",
                    "debit": total,
                    "credit": 0.0,
                    "partner_id": partner_id,
                })
            order.write({"invoice_status": "invoiced"})
        return True
