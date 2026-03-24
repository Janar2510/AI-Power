"""Journal entry / Invoice (Phase 118, 191)."""

from core.orm import Model, api, fields


class AccountMove(Model):
    _name = "account.move"
    _audit = True  # Phase 205
    _description = "Journal Entry"

    name = fields.Char(string="Number", required=True, default="New")
    date = fields.Date(string="Date")

    @classmethod
    def _create_account_move_record(cls, vals):
        """Insert move row after default name from sequence (Phase 481: merge-safe for `_inherit` create)."""
        vals = dict(vals)
        if not vals.get("company_id") and vals.get("journal_id"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            Journal = env.get("account.journal") if env else None
            Company = env.get("res.company") if env else None
            if Journal:
                jrow = Journal.browse(vals["journal_id"]).read(["company_id"])[0]
                jc = jrow.get("company_id")
                jid = jc[0] if isinstance(jc, (list, tuple)) and jc else jc
                if jid:
                    vals["company_id"] = jid
            if not vals.get("company_id") and Company:
                fallback = Company.search([], limit=1)
                if fallback.ids:
                    vals["company_id"] = fallback.ids[0]
        if vals.get("name") == "New" or not vals.get("name"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            cid = vals.get("company_id")
            next_val = (
                IrSequence.next_by_code(
                    "account.move",
                    company_id=cid,
                    reference_date=vals.get("date"),
                )
                if IrSequence
                else None
            )
            if next_val is None:
                nm = "New"
            elif isinstance(next_val, int):
                nm = f"INV/{next_val:05d}"
            else:
                nm = str(next_val)
            vals = dict(vals, name=nm)
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_account_move_record(vals)
    journal_id = fields.Many2one("account.journal", string="Journal", required=True)
    company_id = fields.Many2one(
        "res.company",
        string="Company",
        help="Phase 560: posting lock date is resolved from this company when set; else first company (legacy).",
    )
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
    fiscal_position_id = fields.Many2one(
        "account.fiscal.position",
        string="Fiscal Position",
        help="Phase 551: map draft line tax_ids via apply_fiscal_position_taxes().",
    )
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
        return [AccountMove._compute_amount_residual_for_move(self, move) for move in self]

    def _compute_amount_residual_for_move(self, move):
        """Compute residual amount for a single invoice, net of completed transactions."""
        env = getattr(self, "env", None)
        MoveLine = env.get("account.move.line") if env else None
        Account = env.get("account.account") if env else None
        if not MoveLine or not Account:
            return 0.0
        recv = Account.search([("account_type", "=", "asset_receivable")], limit=1)
        pay = Account.search([("account_type", "=", "liability_payable")], limit=1)
        recv_ids = recv.ids if recv else []
        pay_ids = pay.ids if pay else []
        if move.read(["state"])[0].get("state") == "paid":
            return 0.0
        move_row = move.read(["move_type", "currency_id"])[0]
        move_type = move_row.get("move_type", "")
        currency_id = move_row.get("currency_id")
        currency_id = currency_id[0] if isinstance(currency_id, (list, tuple)) and currency_id else currency_id
        lines = MoveLine.search([("move_id", "=", move.ids[0])])
        line_rows = lines.read(["account_id", "debit", "credit", "amount_currency", "currency_id"]) if getattr(lines, "ids", []) else []
        total = 0.0
        if move_type == "out_invoice" and recv_ids:
            for r in line_rows:
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
            for r in line_rows:
                aid = r.get("account_id")
                aid = aid[0] if isinstance(aid, (list, tuple)) and aid else aid
                if aid in pay_ids:
                    line_cur = r.get("currency_id")
                    line_cur = line_cur[0] if isinstance(line_cur, (list, tuple)) and line_cur else line_cur
                    if currency_id and line_cur == currency_id and (r.get("amount_currency") or 0) != 0:
                        total += abs(float(r.get("amount_currency") or 0))
                    else:
                        total += float(r.get("credit") or 0) - float(r.get("debit") or 0)
        total -= AccountMove._get_done_transaction_amount_for_move(self, move)
        return max(abs(total), 0.0) if total < 0 else max(total, 0.0)

    def _get_done_transaction_amount_for_move(self, move):
        """Sum completed payment.transaction amounts linked to a single invoice."""
        env = getattr(self, "env", None)
        Transaction = env.get("payment.transaction") if env else None
        if not Transaction:
            return 0.0
        total = 0.0
        if not move.ids:
            return 0.0
        txs = Transaction.search([("account_move_id", "=", move.ids[0]), ("state", "=", "done")])
        if not getattr(txs, "ids", []):
            return 0.0
        rows = txs.read(["amount", "state"])
        total += sum(float(row.get("amount") or 0.0) for row in rows if row.get("state") == "done")
        return total

    def _sync_payment_state_from_transactions(self):
        """Mark invoices paid when done transactions fully cover the residual."""
        for move in self:
            if not move.ids:
                continue
            state = move.read(["state"])[0].get("state")
            if state not in ("posted", "paid"):
                continue
            residual = float(AccountMove._compute_amount_residual_for_move(self, move))
            if residual <= 0.0001 and state != "paid":
                move.write({"state": "paid"})
            elif residual > 0.0001 and state == "paid":
                move.write({"state": "posted"})

    line_ids = fields.One2many(
        "account.move.line",
        "move_id",
        string="Journal Items",
    )

    def _validate_balanced_before_post(self):
        """Ensure the move has journal lines and is balanced before posting."""
        MoveLine = self.env.get("account.move.line") if getattr(self, "env", None) else None
        if not MoveLine:
            return
        move_rows = self.read(["state"])
        for mrow in move_rows:
            rid = mrow.get("id")
            if not rid:
                continue
            st = mrow.get("state") or "draft"
            if st != "draft":
                raise ValueError("Cannot post move unless it is in draft state")
            lines = MoveLine.search([("move_id", "=", rid)])
            if not getattr(lines, "ids", []):
                raise ValueError("Cannot post move without journal lines")
            rows = lines.read(["debit", "credit", "account_id"])
            for row in rows:
                aid = row.get("account_id")
                aid = aid[0] if isinstance(aid, (list, tuple)) and aid else aid
                if not aid:
                    raise ValueError("Cannot post move with journal items missing an account")
            total_debit = sum(float(row.get("debit") or 0) for row in rows)
            total_credit = sum(float(row.get("credit") or 0) for row in rows)
            if abs(total_debit - total_credit) > 0.0001:
                raise ValueError("Cannot post move unless journal items are balanced")

    def apply_fiscal_position_taxes(self):
        """Remap draft ``account.move.line`` ``tax_ids`` through ``account.fiscal.position.tax`` (Phase 551)."""
        env = self.env
        if not env:
            return True
        registry = getattr(env, "registry", None)
        FiscalModel = registry.get("account.fiscal.position") if registry else None
        MoveLine = env.get("account.move.line")
        if not FiscalModel or not MoveLine:
            return True
        for move in self:
            if not move.ids:
                continue
            mrow = move.read(["state", "fiscal_position_id"])[0]
            if mrow.get("state") != "draft":
                continue
            fp = mrow.get("fiscal_position_id")
            fp_id = fp[0] if isinstance(fp, (list, tuple)) and fp else fp
            if not fp_id:
                continue
            lines = MoveLine.search([("move_id", "=", move.ids[0])])
            for line in lines:
                lr = line.read(["tax_ids"])[0]
                raw = lr.get("tax_ids") or []
                tids = []
                for x in raw:
                    if isinstance(x, int):
                        tids.append(x)
                    elif isinstance(x, (list, tuple)) and x:
                        tids.append(int(x[0]))
                if not tids:
                    continue
                mapped = FiscalModel.map_tax_ids(env, int(fp_id), tids)
                if mapped != tids:
                    line.write({"tax_ids": [(6, 0, mapped)]})
        return True

    def _check_account_lock_date_before_post(self):
        """Reject post when move date is on/before company account_lock_date (Phase 557, company from move Phase 560)."""
        env = self.env
        if not env:
            return
        Company = env.get("res.company")
        if not Company:
            return
        for move in self:
            if not move.ids:
                continue
            m = move.read(["date", "company_id"])[0]
            d = m.get("date")
            if not d:
                continue
            move_str = str(d)[:10]
            comp = m.get("company_id")
            cid = comp[0] if isinstance(comp, (list, tuple)) and comp else comp
            if cid:
                companies = Company.browse(cid)
            else:
                companies = Company.search([], limit=1)
            if not companies.ids:
                continue
            lock_row = companies.read(["account_lock_date"])[0]
            lock_raw = lock_row.get("account_lock_date")
            if not lock_raw:
                continue
            lock_str = str(lock_raw)[:10]
            if move_str <= lock_str:
                raise ValueError(
                    f"Cannot post move on or before account lock date {lock_str} (move date {move_str})"
                )

    def action_post(self):
        """Post the move: draft -> posted."""
        self._check_account_lock_date_before_post()
        self._validate_balanced_before_post()
        self.write({"state": "posted"})

    def action_cancel(self):
        """Cancel the move."""
        self.write({"state": "cancel"})
