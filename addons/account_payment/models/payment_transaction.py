"""Extend payment.transaction with invoice_ids for portal payment bridge."""

from core.orm import Model, api, fields


class PaymentTransactionAccount(Model):
    _inherit = "payment.transaction"

    invoice_ids = fields.Many2many(
        "account.move",
        "account_invoice_transaction_rel",
        "transaction_id",
        "invoice_id",
        string="Invoices",
        readonly=True,
        copy=False,
        domain=[("move_type", "in", ("out_invoice", "out_refund", "in_invoice", "in_refund"))],
    )
    invoices_count = fields.Integer(
        string="Invoices Count",
        compute="_compute_invoices_count",
    )

    @api.depends("invoice_ids")
    def _compute_invoices_count(self):
        for tx in self:
            tx.invoices_count = len(tx.invoice_ids) if tx.invoice_ids else 0
