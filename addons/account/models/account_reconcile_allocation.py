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
    amount = fields.Float(
        string="Allocated amount",
        required=True,
        default=0.0,
        help="Company currency amount (Phase 577). Phase 647+: when statement and move line share a foreign currency, derived from amount_currency via the move line rate.",
    )
    amount_currency = fields.Float(
        string="Allocated amount currency",
        default=0.0,
        help="Phase 647+: foreign currency slice when statement line currency matches the move line currency.",
    )
    currency_id = fields.Many2one(
        "res.currency",
        string="Allocation currency",
        help="Phase 647+: set when allocation is tracked in foreign currency alongside company amount.",
    )
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        help="Phase 577: must match the move’s company when set.",
    )
