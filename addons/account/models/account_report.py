"""Accounting reports - Trial Balance, P&L, Balance Sheet (Phase 182)."""

from typing import Any, Dict, List

from core.orm import Model


class AccountAccount(Model):
    _inherit = "account.account"

    @classmethod
    def get_trial_balance(cls, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """Trial balance: all accounts with debit, credit, balance for date range. Posted moves only."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        cr = getattr(env, "cr", None)
        if not cr:
            return []
        cr.execute(
            """
            SELECT a.id, a.code, a.name,
                   COALESCE(SUM(aml.debit), 0) as debit,
                   COALESCE(SUM(aml.credit), 0) as credit,
                   COALESCE(SUM(aml.debit), 0) - COALESCE(SUM(aml.credit), 0) as balance
            FROM account_account a
            LEFT JOIN account_move_line aml ON aml.account_id = a.id
            LEFT JOIN account_move am ON am.id = aml.move_id AND am.state = 'posted'
              AND am.date >= %s AND am.date <= %s
            GROUP BY a.id, a.code, a.name
            ORDER BY a.code
            """,
            (date_from or "1900-01-01", date_to or "9999-12-31"),
        )
        rows = cr.fetchall()
        cols = ["id", "code", "name", "debit", "credit", "balance"]
        return [dict(zip(cols, r)) for r in rows]

    @classmethod
    def get_profit_loss(cls, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """Profit & Loss: income minus expense accounts."""
        tb = cls.get_trial_balance(date_from, date_to)
        income_types = ("income",)
        expense_types = ("expense",)
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        cr = getattr(env, "cr", None)
        if not cr:
            return []
        cr.execute("SELECT id, account_type FROM account_account")
        accounts = {row[0]: row[1] for row in cr.fetchall()}
        result = []
        income_total = 0.0
        expense_total = 0.0
        for r in tb:
            atype = accounts.get(r["id"], "")
            balance = r.get("balance", 0) or 0
            if atype in income_types:
                result.append({"type": "income", **r})
                income_total += balance
            elif atype in expense_types:
                result.append({"type": "expense", **r})
                expense_total += balance
        result.append({"type": "total", "name": "Net", "balance": income_total - expense_total})
        return result

    @classmethod
    def get_balance_sheet(cls, date: str) -> List[Dict[str, Any]]:
        """Balance sheet: assets and liabilities at date."""
        tb = cls.get_trial_balance("1900-01-01", date or "9999-12-31")
        asset_types = ("asset_receivable", "asset_cash", "asset_current")
        liability_types = ("liability_payable",)
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        cr = getattr(env, "cr", None)
        if not cr:
            return []
        cr.execute("SELECT id, account_type FROM account_account")
        accounts = {row[0]: row[1] for row in cr.fetchall()}
        result = []
        for r in tb:
            atype = accounts.get(r["id"], "")
            if atype in asset_types or atype in liability_types:
                result.append({**r, "account_type": atype})
        return result
