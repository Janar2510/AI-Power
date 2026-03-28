"""Extend account.move with payment_ids and transaction bridge for portal payment."""

from datetime import date

from core.orm import Model, api, fields


class AccountMovePayment(Model):
    _inherit = "account.move"

    payment_ids = fields.One2many(
        "account.payment",
        "move_id",
        string="Payments",
    )
    transaction_ids = fields.Many2many(
        "payment.transaction",
        "account_invoice_transaction_rel",
        "invoice_id",
        "transaction_id",
        string="Transactions",
        readonly=True,
        copy=False,
    )
    transaction_count = fields.Integer(
        string="Transaction Count",
        compute="_compute_transaction_count",
    )
    amount_paid = fields.Float(
        string="Amount Paid",
        compute="_compute_amount_paid",
    )

    @api.depends("transaction_ids")
    def _compute_transaction_count(self):
        for move in self:
            txs = AccountMovePayment._get_linked_transactions(self, move)
            move.transaction_count = len(txs.ids) if getattr(txs, "ids", None) else 0

    @api.depends("transaction_ids")
    def _compute_amount_paid(self):
        for move in self:
            txs = AccountMovePayment._get_linked_transactions(self, move)
            if not getattr(txs, "ids", None):
                move.amount_paid = 0.0
                continue
            rows = txs.read(["amount", "state"])
            move.amount_paid = sum(r.get("amount") or 0.0 for r in rows if r.get("state") == "done")

    def _get_linked_transactions(self, move):
        """Prefer explicit relation rows, but fall back to direct account_move_id links (Phase 730 / checklist 34)."""
        rel = getattr(move, "transaction_ids", None)
        if rel is not None and getattr(rel, "ids", None):
            return rel
        env = getattr(self, "env", None)
        Transaction = env.get("payment.transaction") if env else None
        if not Transaction or not getattr(move, "ids", None):
            return []
        return Transaction.search([("account_move_id", "=", move.ids[0])])

    def action_register_manual_payment(self, amount: float = None, journal_id: int = None):
        """Create draft ``account.payment`` for posted customer invoice residual (Phase B2 subset)."""
        env = getattr(self, "env", None)
        if not env or not self.ids:
            return []
        Payment = env.get("account.payment")
        Journal = env.get("account.journal")
        if not Payment or not Journal:
            return []
        created = []
        for move in self:
            row = move.read(
                [
                    "move_type",
                    "state",
                    "partner_id",
                    "currency_id",
                    "company_id",
                    "amount_residual",
                ]
            )[0]
            if row.get("state") != "posted" or row.get("move_type") != "out_invoice":
                continue
            residual = float(amount if amount is not None else row.get("amount_residual") or 0)
            if residual <= 0:
                continue
            cid = row.get("company_id")
            cid = cid[0] if isinstance(cid, (list, tuple)) and cid else cid
            if not cid:
                continue
            jid = journal_id
            if not jid:
                j = Journal.search([("type", "=", "bank"), ("company_id", "=", cid)], limit=1)
                if not j.ids:
                    j = Journal.search([("company_id", "=", cid)], limit=1)
                if not j.ids:
                    continue
                jid = j.ids[0]
            partner = row.get("partner_id")
            pid = partner[0] if isinstance(partner, (list, tuple)) and partner else partner
            cur = row.get("currency_id")
            cur_id = cur[0] if isinstance(cur, (list, tuple)) and cur else cur
            pay = Payment.create(
                {
                    "name": "Pay",
                    "date": date.today().isoformat(),
                    "journal_id": jid,
                    "company_id": cid,
                    "state": "draft",
                    "amount": residual,
                    "currency_id": cur_id,
                    "partner_id": pid,
                    "payment_type": "inbound",
                    "partner_type": "customer",
                    "move_id": move.ids[0],
                    "memo": "Manual register",
                }
            )
            pid_val = pay.ids[0] if getattr(pay, "ids", None) else getattr(pay, "id", None)
            if pid_val:
                created.append(pid_val)
        return created
