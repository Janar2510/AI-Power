"""Bank statement reconciliation (Phase 193)."""

from core.orm import Model


class AccountBankStatementLine(Model):
    _inherit = "account.bank.statement.line"

    def _auto_reconcile(self):
        """Match this statement line against open account.move.line by amount + partner (Phase 200: multi-currency)."""
        if not self or not self.ids:
            return
        env = getattr(self, "env", None)
        MoveLine = env.get("account.move.line") if env else None
        Account = env.get("account.account") if env else None
        if not MoveLine or not Account:
            return
        bank_accounts = Account.search([("account_type", "=", "asset_cash")])
        bank_ids = bank_accounts.ids if bank_accounts else []
        if not bank_ids:
            return
        for rec in self:
            row = rec.read(["amount", "partner_id", "move_id", "statement_id", "date"])[0]
            if row.get("move_id"):
                continue  # already reconciled
            amount = float(row.get("amount") or 0)
            stmt_id = row.get("statement_id")
            stmt_id = stmt_id[0] if isinstance(stmt_id, (list, tuple)) and stmt_id else stmt_id
            if stmt_id:
                Stmt = env.get("account.bank.statement")
                Currency = env.get("res.currency")
                Company = env.get("res.company")
                if Stmt and Currency and Company:
                    stmt = Stmt.browse(stmt_id).read(["currency_id"])[0]
                    stmt_cur = stmt.get("currency_id")
                    stmt_cur = stmt_cur[0] if isinstance(stmt_cur, (list, tuple)) and stmt_cur else stmt_cur
                    companies = Company.search([], limit=1)
                    company_cur = companies.read(["currency_id"])[0].get("currency_id") if companies.ids else None
                    company_cur = company_cur[0] if isinstance(company_cur, (list, tuple)) and company_cur else company_cur
                    if stmt_cur and company_cur and stmt_cur != company_cur:
                        amount = Currency.convert(amount, stmt_cur, company_cur, row.get("date"))
            partner_id = row.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            domain = [("account_id", "in", bank_ids)]
            if hasattr(MoveLine, "reconciled_id"):
                domain.append(("reconciled_id", "=", False))
            if partner_id:
                domain.append(("partner_id", "=", partner_id))
            candidates = MoveLine.search(domain)
            if not candidates:
                continue
            for line in candidates:
                lrow = line.read(["debit", "credit", "move_id"])[0]
                bal = (lrow.get("debit") or 0) - (lrow.get("credit") or 0)
                if abs(bal - amount) < 0.01:
                    mid = lrow.get("move_id")
                    if isinstance(mid, (list, tuple)) and mid:
                        mid = mid[0]
                    if mid:
                        rec.write({"move_id": mid})
                    break
