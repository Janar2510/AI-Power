"""Extend account.move with payment_ids and transaction bridge for portal payment."""

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
