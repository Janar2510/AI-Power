"""Partial bank reconciliation allocations (Phase 577)."""

from core.orm import Model, fields


class AccountReconcileAllocation(Model):
    """Links statement lines to move lines with a partial amount (audit trail)."""

    _name = "account.reconcile.allocation"
    _description = "Reconcile allocation"
    _table = "account_reconcile_allocation"

    statement_line_id = fields.Many2one(
        "account.bank.statement.line",
        string="Statement Line",
        required=True,
        ondelete="cascade",
    )
    move_line_id = fields.Many2one(
        "account.move.line",
        string="Journal Item",
        required=True,
        ondelete="cascade",
    )
    amount = fields.Float(string="Allocated amount", required=True, default=0.0)
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        help="Phase 577: must match the move’s company when set.",
    )
