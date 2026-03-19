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
            move.transaction_count = len(move.transaction_ids) if move.transaction_ids else 0

    @api.depends("transaction_ids")
    def _compute_amount_paid(self):
        for move in self:
            if not move.transaction_ids:
                move.amount_paid = 0.0
                continue
            rows = move.transaction_ids.read(["amount", "state"])
            move.amount_paid = sum(r.get("amount") or 0.0 for r in rows if r.get("state") == "done")
