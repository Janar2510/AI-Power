"""Bank statement and lines (Phase 193). Extended Phase 744 (extra fields + is_reconciled)."""

from core.orm import Model, api, fields


class AccountBankStatement(Model):
    _name = "account.bank.statement"
    _description = "Bank Statement"

    name = fields.Char(string="Reference", required=True, default="New")

    @classmethod
    def _create_account_bank_statement_record(cls, vals):
        """Name from sequence + ORM insert (Phase 487: merge-safe for `_inherit` create)."""
        if vals.get("name") == "New" or not vals.get("name"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            Journal = env.get("account.journal") if env else None
            cid = None
            jid = vals.get("journal_id")
            jid = jid[0] if isinstance(jid, (list, tuple)) and jid else jid
            if Journal and jid:
                jr = Journal.browse(jid).read(["company_id"])[0].get("company_id")
                cid = jr[0] if isinstance(jr, (list, tuple)) and jr else jr
            next_val = (
                IrSequence.next_by_code("account.bank.statement", company_id=cid) if IrSequence else None
            )
            vals = dict(vals, name=f"BSTAT/{next_val:05d}" if next_val is not None else "New")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_account_bank_statement_record(vals)
    journal_id = fields.Many2one("account.journal", string="Journal", required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")  # Phase 200: statement currency
    date = fields.Date(string="Date", required=True)
    balance_start = fields.Float(string="Starting Balance", default=0.0)
    balance_end_real = fields.Float(string="Ending Balance")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("posted", "Posted"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
    line_ids = fields.One2many(
        "account.bank.statement.line",
        "statement_id",
        string="Statement Lines",
    )

    def action_post(self):
        """Post statement: draft -> posted."""
        self.write({"state": "posted"})

    def action_cancel(self):
        """Cancel statement."""
        self.write({"state": "cancel"})

    def action_reconcile(self):
        """Open reconciliation wizard for unreconciled statement lines (Phase 195)."""
        if not self or not self.ids:
            return None
        env = getattr(self, "env", None)
        Wizard = env.get("account.reconcile.wizard") if env else None
        StmtLine = env.get("account.bank.statement.line") if env else None
        if not Wizard or not StmtLine:
            return None
        stmt_id = self.ids[0]
        lines = StmtLine.search([("statement_id", "=", stmt_id), ("move_id", "=", False)])
        if not lines.ids:
            return None
        wiz = Wizard.create({"statement_line_ids": lines.ids})
        return wiz.action_open_wizard()


class AccountBankStatementLine(Model):
    _name = "account.bank.statement.line"
    _description = "Bank Statement Line"

    statement_id = fields.Many2one(
        "account.bank.statement",
        string="Statement",
        required=True,
        ondelete="cascade",
    )
    sequence = fields.Integer(string="Sequence", default=10)
    name = fields.Char(string="Label", required=True)
    date = fields.Date(string="Date", required=True)
    amount = fields.Float(string="Amount", required=True)
    amount_currency = fields.Float(string="Amount in Currency")
    foreign_currency_id = fields.Many2one("res.currency", string="Foreign Currency", ondelete="set null")
    partner_id = fields.Many2one("res.partner", string="Partner")
    payment_ref = fields.Char(string="Payment Reference")
    transaction_type = fields.Char(string="Transaction Type")
    move_id = fields.Many2one("account.move", string="Journal Entry")
    is_reconciled = fields.Computed(
        compute="_compute_is_reconciled",
        store=False,
        string="Is Reconciled",
        depends=["move_id"],
    )

    @api.depends("move_id")
    def _compute_is_reconciled(self):
        if not self:
            return []
        rows = self.read(["move_id"])
        out = []
        for row in rows:
            mid = row.get("move_id")
            has_move = bool(mid and (mid[0] if isinstance(mid, (list, tuple)) else mid))
            out.append({"id": row["id"], "is_reconciled": has_move})
        return out
