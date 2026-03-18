"""Journal entry / Invoice (Phase 118, 191)."""

from core.orm import Model, api, fields


class AccountMove(Model):
    _name = "account.move"
    _audit = True  # Phase 205
    _description = "Journal Entry"

    name = fields.Char(string="Number", required=True, default="New")
    date = fields.Date(string="Date")

    @classmethod
    def create(cls, vals):
        if vals.get("name") == "New" or not vals.get("name"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("account.move") if IrSequence else None
            vals = dict(vals, name=f"INV/{next_val:05d}" if next_val is not None else "New")
        return super().create(vals)
    journal_id = fields.Many2one("account.journal", string="Journal", required=True)
    partner_id = fields.Many2one("res.partner", string="Partner")
    currency_id = fields.Many2one("res.currency", string="Currency")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("posted", "Posted"),
            ("paid", "Paid"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
        tracking=True,
    )
    move_type = fields.Selection(
        selection=[
            ("out_invoice", "Customer Invoice"),
            ("in_invoice", "Vendor Bill"),
            ("entry", "Journal Entry"),
        ],
        string="Type",
        default="entry",
    )
    invoice_origin = fields.Char(string="Source")
    payment_term_id = fields.Many2one("account.payment.term", string="Payment Terms")  # Phase 191
    invoice_date_due = fields.Computed(compute="_compute_invoice_date_due", store=True, string="Due Date")  # Phase 191
    amount_residual = fields.Computed(
        compute="_compute_amount_residual",
        store=True,
        string="Residual",
        depends=["state", "line_ids.debit", "line_ids.credit", "line_ids.amount_currency", "line_ids.account_id"],
    )  # Phase 200

    @api.depends("payment_term_id", "date", "line_ids.debit", "line_ids.credit")
    def _compute_invoice_date_due(self):
        if not self:
            return []
        rows = self.read(["payment_term_id", "date"])
        result = []
        env = getattr(self, "env", None)
        Term = env.get("account.payment.term") if env else None
        MoveLine = env.get("account.move.line") if env else None
        for row in rows:
            due = None
            pt_val = row.get("payment_term_id")
            pt_id = pt_val[0] if isinstance(pt_val, (list, tuple)) and pt_val else (pt_val if isinstance(pt_val, int) else None)
            date_val = row.get("date")
            if pt_id and date_val:
                if isinstance(date_val, str) and len(date_val) >= 10:
                    date_val = date_val[:10]
                amount = 1.0
                if MoveLine and self.ids and row.get("id"):
                    mid = row["id"]
                    lines = MoveLine.search([("move_id", "=", mid)])
                    if lines:
                        lrows = lines.read(["debit", "credit"])
                        amount = sum((r.get("debit") or 0) - (r.get("credit") or 0) for r in lrows)
                        if amount < 0:
                            amount = -amount
                        if amount <= 0:
                            amount = 1.0
                if Term:
                    term = Term.browse(pt_id)
                    installments = term.compute(amount, date_val)
                    if installments:
                        due = installments[-1][1]
            result.append(due)
        return result

    def _compute_amount_residual(self):
        """Residual amount in invoice currency (Phase 200). 0 when paid."""
        if not self:
            return []
        env = getattr(self, "env", None)
        MoveLine = env.get("account.move.line") if env else None
        Account = env.get("account.account") if env else None
        if not MoveLine or not Account:
            return [0.0] * len(self.ids)
        recv = Account.search([("account_type", "=", "asset_receivable")], limit=1)
        pay = Account.search([("account_type", "=", "liability_payable")], limit=1)
        recv_ids = recv.ids if recv else []
        pay_ids = pay.ids if pay else []
        result = []
        for move in self:
            if move.read(["state"])[0].get("state") == "paid":
                result.append(0.0)
                continue
            move_type = move.read(["move_type", "currency_id"])[0].get("move_type", "")
            currency_id = move.read(["currency_id"])[0].get("currency_id")
            currency_id = currency_id[0] if isinstance(currency_id, (list, tuple)) and currency_id else currency_id
            lines = MoveLine.search([("move_id", "=", move.ids[0])])
            total = 0.0
            if move_type == "out_invoice" and recv_ids:
                for ln in lines:
                    r = ln.read(["account_id", "debit", "credit", "amount_currency", "currency_id"])[0]
                    aid = r.get("account_id")
                    aid = aid[0] if isinstance(aid, (list, tuple)) and aid else aid
                    if aid in recv_ids:
                        line_cur = r.get("currency_id")
                        line_cur = line_cur[0] if isinstance(line_cur, (list, tuple)) and line_cur else line_cur
                        if currency_id and line_cur == currency_id and (r.get("amount_currency") or 0) != 0:
                            total += float(r.get("amount_currency") or 0)
                        else:
                            total += float(r.get("debit") or 0) - float(r.get("credit") or 0)
            elif move_type == "in_invoice" and pay_ids:
                for ln in lines:
                    r = ln.read(["account_id", "debit", "credit", "amount_currency", "currency_id"])[0]
                    aid = r.get("account_id")
                    aid = aid[0] if isinstance(aid, (list, tuple)) and aid else aid
                    if aid in pay_ids:
                        line_cur = r.get("currency_id")
                        line_cur = line_cur[0] if isinstance(line_cur, (list, tuple)) and line_cur else line_cur
                        if currency_id and line_cur == currency_id and (r.get("amount_currency") or 0) != 0:
                            total += abs(float(r.get("amount_currency") or 0))
                        else:
                            total += float(r.get("credit") or 0) - float(r.get("debit") or 0)
            result.append(abs(total))
        return result

    line_ids = fields.One2many(
        "account.move.line",
        "move_id",
        string="Journal Items",
    )

    def action_post(self):
        """Post the move: draft -> posted."""
        self.write({"state": "posted"})

    def action_cancel(self):
        """Cancel the move."""
        self.write({"state": "cancel"})
