"""Payment transaction (Phase 156)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _name = "payment.transaction"
    _description = "Payment Transaction"

    @classmethod
    def _create_payment_transaction_record(cls, vals):
        """ORM insert only (Phase 482: merge-safe hook for `_inherit` create overrides)."""
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        tx = cls._create_payment_transaction_record(vals)
        if getattr(tx, "ids", None):
            tx._sync_linked_invoice_payment_state()
        return tx

    provider_id = fields.Many2one("payment.provider", string="Provider", required=True)
    amount = fields.Float(required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")
    partner_id = fields.Many2one("res.partner", string="Customer")
    sale_order_id = fields.Many2one("sale.order", string="Sale Order")
    account_move_id = fields.Many2one("account.move", string="Invoice")  # Phase 199
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("pending", "Pending"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
            ("error", "Error"),
        ],
        default="draft",
    )
    reference = fields.Char(string="Reference")

    def write(self, vals):
        result = super().write(vals)
        if any(key in vals for key in ("state", "amount", "account_move_id")):
            self._sync_linked_invoice_payment_state()
        return result

    def _sync_linked_invoice_payment_state(self):
        """When a transaction completes, refresh the linked invoice payment state."""
        env = getattr(self, "env", None)
        Move = env.get("account.move") if env else None
        Payment = env.get("account.payment") if env else None
        Journal = env.get("account.journal") if env else None
        Company = env.get("res.company") if env else None
        if not Move:
            return
        for tx in self:
            if not tx.ids:
                continue
            row = tx.read(["state", "account_move_id", "amount", "reference", "partner_id", "currency_id"])[0]
            if row.get("state") != "done":
                continue
            move_id = row.get("account_move_id")
            move_id = move_id[0] if isinstance(move_id, (list, tuple)) and move_id else move_id
            if not move_id:
                continue
            invoice = Move.browse(move_id)
            if invoice.ids and hasattr(invoice, "_sync_payment_state_from_transactions"):
                invoice._sync_payment_state_from_transactions()
            if Payment and Journal and Company and invoice.ids:
                PaymentTransaction._ensure_account_payment_record(tx, invoice, row, Payment, Journal, Company)

    def _ensure_account_payment_record(self, invoice, tx_row, Payment, Journal, Company):
        """Create a durable account.payment row for a completed transaction if missing."""
        move_id = invoice.ids[0] if getattr(invoice, "ids", None) else None
        if not move_id:
            return
        payment_ref = tx_row.get("reference") or f"TX-{move_id}"
        existing = Payment.search([("move_id", "=", move_id), ("payment_reference", "=", payment_ref)], limit=1)
        if getattr(existing, "ids", None):
            return
        journal = Journal.search([("type", "=", "bank")], limit=1)
        if not getattr(journal, "ids", None):
            journal = Journal.search([("type", "=", "general")], limit=1)
        company = Company.search([], limit=1)
        if not getattr(journal, "ids", None) or not getattr(company, "ids", None):
            return
        invoice_row = invoice.read(["partner_id", "currency_id", "date", "name"])[0]
        partner_id = tx_row.get("partner_id") or invoice_row.get("partner_id")
        if isinstance(partner_id, (list, tuple)) and partner_id:
            partner_id = partner_id[0]
        currency_id = tx_row.get("currency_id") or invoice_row.get("currency_id")
        if isinstance(currency_id, (list, tuple)) and currency_id:
            currency_id = currency_id[0]
        Payment.create({
            "move_id": move_id,
            "journal_id": journal.ids[0],
            "company_id": company.ids[0],
            "date": invoice_row.get("date"),
            "state": "paid",
            "amount": tx_row.get("amount") or 0.0,
            "currency_id": currency_id,
            "partner_id": partner_id,
            "payment_type": "inbound",
            "partner_type": "customer",
            "payment_reference": payment_ref,
            "memo": invoice_row.get("name") or payment_ref,
        })
