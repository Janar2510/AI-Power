"""Reconciliation wizard (Phase 195)."""

import uuid
from core.orm import TransientModel, fields


class AccountReconcileWizard(TransientModel):
    _name = "account.reconcile.wizard"
    _description = "Reconcile Bank Statement Lines"

    statement_line_ids = fields.Many2many(
        "account.bank.statement.line",
        relation="account_reconcile_wizard_statement_line_rel",
        column1="wizard_id",
        column2="statement_line_id",
        string="Statement Lines",
    )
    line_ids = fields.One2many(
        "account.reconcile.wizard.line",
        "wizard_id",
        string="Reconciliation Lines",
    )

    @classmethod
    def default_get(cls, field_names, context=None):
        """Pre-fill statement lines from context default_statement_line_ids or active_id."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        ctx = context or {}
        result = {}
        if "statement_line_ids" in (field_names or []):
            line_ids = ctx.get("default_statement_line_ids") or ctx.get("active_ids") or []
            if not line_ids and ctx.get("active_model") == "account.bank.statement" and ctx.get("active_id"):
                StmtLine = env.get("account.bank.statement.line") if env else None
                if StmtLine:
                    lines = StmtLine.search([("statement_id", "=", ctx["active_id"]), ("move_id", "=", False)])
                    line_ids = lines.ids
            result["statement_line_ids"] = line_ids
        return result

    def _prepare_wizard_lines(self):
        """Build wizard lines from statement lines with suggested move lines."""
        if not self or not self.ids:
            return
        env = getattr(self, "env", None)
        StmtLine = env.get("account.bank.statement.line") if env else None
        MoveLine = env.get("account.move.line") if env else None
        Account = env.get("account.account") if env else None
        WizardLine = env.get("account.reconcile.wizard.line") if env else None
        if not all([StmtLine, MoveLine, Account, WizardLine]):
            return
        bank_accounts = Account.search([("account_type", "=", "asset_cash")])
        bank_ids = bank_accounts.ids if bank_accounts else []
        if not bank_ids:
            return
        for wiz in self:
            stmt_line_ids = wiz.statement_line_ids.ids if wiz.statement_line_ids else []
            if not stmt_line_ids:
                continue
            lines_data = []
            for stmt_line in StmtLine.browse(stmt_line_ids):
                row = stmt_line.read(["amount", "partner_id"])[0]
                amount = float(row.get("amount") or 0)
                partner_id = row.get("partner_id")
                if isinstance(partner_id, (list, tuple)) and partner_id:
                    partner_id = partner_id[0]
                domain = [("account_id", "in", bank_ids), ("reconciled_id", "=", False)]
                if partner_id:
                    domain.append(("partner_id", "=", partner_id))
                candidates = MoveLine.search(domain)
                suggested_id = None
                for line in candidates:
                    lrow = line.read(["debit", "credit"])[0]
                    bal = (lrow.get("debit") or 0) - (lrow.get("credit") or 0)
                    if abs(bal - amount) < 0.01:
                        suggested_id = line.ids[0]
                        break
                lines_data.append({
                    "wizard_id": wiz.ids[0],
                    "statement_line_id": stmt_line.ids[0],
                    "move_line_id": suggested_id,
                })
            for line_vals in lines_data:
                WizardLine.create(line_vals)

    @classmethod
    def create(cls, vals_list):
        records = super().create(vals_list)
        for rec in records:
            rec._prepare_wizard_lines()
        return records

    def _action_reconcile_legacy_full_match(self):
        """Full statement line ↔ move link when allocation model is unavailable."""
        env = getattr(self, "env", None)
        StmtLine = env.get("account.bank.statement.line") if env else None
        MoveLine = env.get("account.move.line") if env else None
        WizardLine = env.get("account.reconcile.wizard.line") if env else None
        if not StmtLine or not MoveLine or not WizardLine:
            return None
        recon_id = str(uuid.uuid4())
        for wiz in self:
            line_ids = wiz.line_ids.ids if wiz.line_ids else []
            for line in WizardLine.browse(line_ids):
                row = line.read(["statement_line_id", "move_line_id"])[0]
                stmt_val = row.get("statement_line_id")
                stmt_line_id = stmt_val[0] if isinstance(stmt_val, (list, tuple)) and stmt_val else stmt_val
                move_val = row.get("move_line_id")
                move_line_id = move_val[0] if isinstance(move_val, (list, tuple)) and move_val else move_val
                if not stmt_line_id or not move_line_id:
                    continue
                ml_row = MoveLine.browse(move_line_id).read(["move_id"])[0]
                move_id = ml_row.get("move_id")
                move_id = move_id[0] if isinstance(move_id, (list, tuple)) and move_id else move_id
                if not move_id:
                    continue
                StmtLine.browse(stmt_line_id).write({"move_id": move_id})
                MoveLine.browse(move_line_id).write({"reconciled_id": recon_id})
        self.unlink()
        return None

    def action_reconcile(self):
        """Reconcile selected statement lines with move lines (Phase 577: partial allocations)."""
        if not self or not self.ids:
            return None
        env = getattr(self, "env", None)
        StmtLine = env.get("account.bank.statement.line") if env else None
        Stmt = env.get("account.bank.statement") if env else None
        MoveLine = env.get("account.move.line") if env else None
        Move = env.get("account.move") if env else None
        Alloc = env.get("account.reconcile.allocation") if env else None
        WizardLine = env.get("account.reconcile.wizard.line") if env else None
        if not StmtLine or not MoveLine or not WizardLine:
            return None
        if not Alloc:
            return self._action_reconcile_legacy_full_match()
        recon_id = str(uuid.uuid4())

        def _m2o_id(val):
            if isinstance(val, (list, tuple)) and val:
                return val[0]
            return val

        def _statement_currency_id_from_srow(srow):
            if not Stmt:
                return None
            sid = srow.get("statement_id")
            stmt_id = sid[0] if isinstance(sid, (list, tuple)) and sid else sid
            if not stmt_id:
                return None
            crow = Stmt.browse(stmt_id).read(["currency_id"])[0].get("currency_id")
            return _m2o_id(crow)

        def _completion_stmt_target_company(sid_inner: int) -> float:
            """Phase 647+: statement line open amount in company currency for full-match check."""
            srow_inner = StmtLine.browse(sid_inner).read(["amount", "statement_id"])[0]
            stmt_f = abs(float(srow_inner.get("amount") or 0))
            stmt_ccy_id = _statement_currency_id_from_srow(srow_inner)
            alloc_rows = Alloc.search_read(
                [("statement_line_id", "=", sid_inner)], ["move_line_id"], limit=1
            )
            if not alloc_rows:
                return stmt_f
            mlid = _m2o_id(alloc_rows[0].get("move_line_id"))
            if not mlid:
                return stmt_f
            mdata = MoveLine.browse(mlid).read(
                ["currency_id", "amount_currency", "debit", "credit"]
            )[0]
            bal = abs(float(mdata.get("debit") or 0) - float(mdata.get("credit") or 0))
            ml_ccy_id = _m2o_id(mdata.get("currency_id"))
            ml_amt_curr = float(mdata.get("amount_currency") or 0)
            if (
                stmt_ccy_id
                and ml_ccy_id
                and int(stmt_ccy_id) == int(ml_ccy_id)
                and abs(ml_amt_curr) > 1e-9
            ):
                rate = bal / abs(ml_amt_curr)
                return stmt_f * rate
            return stmt_f

        def _sum_alloc_stmt(sid: int) -> float:
            if not Alloc:
                return 0.0
            rows = Alloc.search_read([("statement_line_id", "=", sid)], ["amount"])
            return sum(float(r.get("amount") or 0) for r in rows)

        def _sum_alloc_ml(mlid: int) -> float:
            if not Alloc:
                return 0.0
            rows = Alloc.search_read([("move_line_id", "=", mlid)], ["amount"])
            return sum(float(r.get("amount") or 0) for r in rows)

        for wiz in self:
            line_ids = wiz.line_ids.ids if wiz.line_ids else []
            if not line_ids:
                continue
            touched_stmt = set()
            touched_ml = set()
            for line in WizardLine.browse(line_ids):
                row = line.read(["statement_line_id", "move_line_id", "allocate_amount"])[0]
                stmt_val = row.get("statement_line_id")
                stmt_line_id = stmt_val[0] if isinstance(stmt_val, (list, tuple)) and stmt_val else stmt_val
                move_val = row.get("move_line_id")
                move_line_id = move_val[0] if isinstance(move_val, (list, tuple)) and move_val else move_val
                if not stmt_line_id or not move_line_id:
                    continue
                srow = StmtLine.browse(stmt_line_id).read(["amount", "statement_id"])[0]
                stmt_amt_f = abs(float(srow.get("amount") or 0))
                ml_row = MoveLine.browse(move_line_id).read(
                    ["debit", "credit", "move_id", "currency_id", "amount_currency"]
                )[0]
                bal = abs(float(ml_row.get("debit") or 0) - float(ml_row.get("credit") or 0))
                ml_ccy_id = _m2o_id(ml_row.get("currency_id"))
                ml_amt_curr = float(ml_row.get("amount_currency") or 0)
                stmt_ccy_id = _statement_currency_id_from_srow(srow)
                fx_same = (
                    bool(ml_ccy_id)
                    and bool(stmt_ccy_id)
                    and int(ml_ccy_id) == int(stmt_ccy_id)
                    and abs(ml_amt_curr) > 1e-9
                )
                rate = (bal / abs(ml_amt_curr)) if fx_same else 1.0
                stmt_amt = stmt_amt_f * rate if fx_same else stmt_amt_f
                user_amt = float(row.get("allocate_amount") or 0)
                if user_amt > 0:
                    want = min(user_amt, stmt_amt, bal)
                else:
                    want = min(stmt_amt, bal)
                stmt_left = stmt_amt - _sum_alloc_stmt(stmt_line_id)
                ml_left = bal - _sum_alloc_ml(move_line_id)
                alloc_amt = min(want, stmt_left, ml_left)
                if alloc_amt <= 1e-9:
                    continue
                move_id = ml_row.get("move_id")
                move_id = move_id[0] if isinstance(move_id, (list, tuple)) and move_id else move_id
                comp = None
                if move_id and Move:
                    crow = Move.browse(move_id).read(["company_id"])[0].get("company_id")
                    comp = crow[0] if isinstance(crow, (list, tuple)) and crow else crow
                if Alloc:
                    vals = {
                        "statement_line_id": stmt_line_id,
                        "move_line_id": move_line_id,
                        "amount": alloc_amt,
                        "company_id": comp,
                    }
                    if fx_same and rate > 1e-12:
                        vals["currency_id"] = ml_ccy_id
                        vals["amount_currency"] = alloc_amt / rate
                    Alloc.create(vals)
                touched_stmt.add(stmt_line_id)
                touched_ml.add(move_line_id)

            if not Alloc:
                continue
            for sid in touched_stmt:
                stmt_amt = _completion_stmt_target_company(sid)
                if _sum_alloc_stmt(sid) + 0.01 < stmt_amt:
                    continue
                alloc_rows = Alloc.search_read([("statement_line_id", "=", sid)], ["move_line_id"])
                if not alloc_rows:
                    continue
                ml_ref = alloc_rows[0].get("move_line_id")
                mlid = ml_ref[0] if isinstance(ml_ref, (list, tuple)) and ml_ref else ml_ref
                if not mlid:
                    continue
                mv = MoveLine.browse(mlid).read(["move_id"])[0].get("move_id")
                mid = mv[0] if isinstance(mv, (list, tuple)) and mv else mv
                if mid:
                    StmtLine.browse(sid).write({"move_id": mid})
            for mlid in touched_ml:
                mdata = MoveLine.browse(mlid).read(["debit", "credit"])[0]
                bal = abs(float(mdata.get("debit") or 0) - float(mdata.get("credit") or 0))
                if _sum_alloc_ml(mlid) + 0.01 < bal:
                    continue
                MoveLine.browse(mlid).write({"reconciled_id": recon_id})
        self.unlink()
        return None

    def action_open_wizard(self):
        """Called from statement: create wizard, return action to open it."""
        if not self or not self.ids:
            return None
        return {
            "type": "ir.actions.act_window",
            "res_model": "account.reconcile.wizard",
            "res_id": self.ids[0],
            "view_mode": "form",
            "target": "current",
        }


class AccountReconcileWizardLine(TransientModel):
    _name = "account.reconcile.wizard.line"
    _description = "Reconciliation Wizard Line"

    wizard_id = fields.Many2one(
        "account.reconcile.wizard",
        string="Wizard",
        required=True,
        ondelete="cascade",
    )
    statement_line_id = fields.Many2one(
        "account.bank.statement.line",
        string="Statement Line",
        required=True,
    )
    move_line_id = fields.Many2one(
        "account.move.line",
        string="Journal Item",
    )
    allocate_amount = fields.Float(
        string="Amount to allocate",
        default=0.0,
        help="Phase 577: 0 = auto (min of statement line and move line open amounts).",
    )
