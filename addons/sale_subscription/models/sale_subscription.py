"""Subscription model. Phase 221."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from core.orm import Model, fields


class SaleSubscription(Model):
    _name = "sale.subscription"
    _description = "Subscription"

    name = fields.Char(required=True, default="New")
    partner_id = fields.Many2one("res.partner", string="Customer", required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")
    plan_id = fields.Many2one("sale.subscription.plan", string="Plan")
    date_start = fields.Date(string="Start Date")
    date_end = fields.Date(string="End Date")
    recurring_next_date = fields.Date(string="Next Invoice Date")
    recurring_rule_type = fields.Selection(
        selection=[("monthly", "Monthly"), ("yearly", "Yearly")],
        default="monthly",
    )
    recurring_amount = fields.Float(default=0)
    stage = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("running", "Running"),
            ("paused", "Paused"),
            ("closed", "Closed"),
            ("cancelled", "Cancelled"),
        ],
        default="draft",
    )
    line_ids = fields.One2many(
        "sale.subscription.line",
        "subscription_id",
        string="Lines",
    )

    @classmethod
    def create(cls, vals: Dict[str, Any], env: Any = None):
        if vals.get("name") == "New" or not vals.get("name"):
            env = env or (getattr(cls._registry, "_env", None) if cls._registry else None)
            if env:
                IrSequence = env.get("ir.sequence")
                if IrSequence:
                    next_val = IrSequence.next_by_code("sale.subscription")
                    if next_val is not None:
                        vals = dict(vals, name=f"SUB/{next_val:05d}")
        return super().create(vals, env=env)

    def action_start(self):
        """Draft -> Running."""
        self.write({"stage": "running"})
        for sub in self:
            if sub.ids and not sub.read(["recurring_next_date"])[0].get("recurring_next_date"):
                start = sub.read(["date_start"])[0].get("date_start")
                if start:
                    sub.write({"recurring_next_date": start[:10] if isinstance(start, str) else str(start)[:10]})

    def action_pause(self):
        """Running -> Paused."""
        self.write({"stage": "paused"})

    def action_resume(self):
        """Paused -> Running."""
        self.write({"stage": "running"})

    def action_close(self):
        """-> Closed."""
        self.write({"stage": "closed"})

    def action_cancel(self):
        """-> Cancelled."""
        self.write({"stage": "cancelled"})

    def _generate_invoice(self) -> Any:
        """Create account.move (out_invoice) for this subscription. Returns move or None."""
        if not self or not self.ids:
            return None
        Move = self.env.get("account.move")
        MoveLine = self.env.get("account.move.line")
        Journal = self.env.get("account.journal")
        Account = self.env.get("account.account")
        if not all([Move, MoveLine, Journal, Account]):
            return None
        sale_journal = Journal.search([("type", "=", "sale")], limit=1)
        if not sale_journal.ids:
            return None
        income_account = Account.search([("account_type", "=", "income")], limit=1)
        receivable_account = Account.search([("account_type", "=", "asset_receivable")], limit=1)
        if not income_account.ids or not receivable_account.ids:
            return None
        sub = self
        data = sub.read(["partner_id", "currency_id", "recurring_amount", "name"])[0]
        partner_id = data.get("partner_id")
        if isinstance(partner_id, (list, tuple)) and partner_id:
            partner_id = partner_id[0]
        currency_id = data.get("currency_id")
        if isinstance(currency_id, (list, tuple)) and currency_id:
            currency_id = currency_id[0]
        amount = float(data.get("recurring_amount") or 0)
        if amount <= 0:
            Company = self.env.get("res.company")
            if Company:
                lines = sub.read(["line_ids"])[0].get("line_ids") or []
                if isinstance(lines, list):
                    Line = self.env.get("sale.subscription.line")
                    if Line:
                        for lid in lines[:5]:
                            if isinstance(lid, (list, tuple)) and lid:
                                lid = lid[0]
                            lrows = Line.search_read([("id", "=", lid)], ["quantity", "price_unit", "price_subtotal"])
                            if lrows:
                                amount += float(lrows[0].get("price_subtotal") or lrows[0].get("quantity", 1) * lrows[0].get("price_unit", 0))
        if amount <= 0:
            return None
        Company = self.env.get("res.company")
        company_currency_id = None
        if Company:
            companies = Company.search([], limit=1)
            if companies.ids:
                cdata = Company.browse(companies.ids[0]).read(["currency_id"])[0]
                company_currency_id = cdata.get("currency_id")
                if isinstance(company_currency_id, (list, tuple)) and company_currency_id:
                    company_currency_id = company_currency_id[0]
        move_currency_id = currency_id or company_currency_id
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        move_vals = {
            "journal_id": sale_journal.ids[0],
            "partner_id": partner_id,
            "currency_id": move_currency_id,
            "move_type": "out_invoice",
            "invoice_origin": data.get("name", ""),
            "state": "draft",
            "date": today,
        }
        move = Move.create(move_vals)
        if not move.ids:
            return None
        mid = move.ids[0] if hasattr(move, "ids") else move.id
        MoveLine.create({
            "move_id": mid,
            "account_id": income_account.ids[0],
            "name": "Subscription " + (data.get("name") or ""),
            "debit": 0.0,
            "credit": amount,
            "partner_id": partner_id,
        })
        MoveLine.create({
            "move_id": mid,
            "account_id": receivable_account.ids[0],
            "name": "Receivable",
            "debit": amount,
            "credit": 0.0,
            "partner_id": partner_id,
        })
        return move

    @classmethod
    def _cron_recurring_invoice(cls) -> int:
        """Cron: generate invoices for subscriptions where recurring_next_date <= today and stage=running."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        Sub = env.get("sale.subscription")
        if not Sub:
            return 0
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        recs = Sub.search([
            ("stage", "=", "running"),
            ("recurring_next_date", "<=", today),
        ], limit=50)
        count = 0
        for sub in recs:
            try:
                move = sub._generate_invoice()
                if move:
                    sub._advance_recurring_next_date()
                    count += 1
            except Exception:
                pass
        return count

    def _advance_recurring_next_date(self):
        """Advance recurring_next_date by one period."""
        if not self or not self.ids:
            return
        for sub in self:
            next_date = sub.read(["recurring_next_date", "recurring_rule_type"])[0].get("recurring_next_date")
            rule = sub.read(["recurring_rule_type"])[0].get("recurring_rule_type") or "monthly"
            if not next_date:
                continue
            if isinstance(next_date, str) and len(next_date) >= 10:
                next_date = next_date[:10]
            try:
                dt = datetime.strptime(str(next_date)[:10], "%Y-%m-%d")
                if rule == "yearly":
                    dt = dt.replace(year=dt.year + 1)
                else:
                    if dt.month == 12:
                        dt = dt.replace(year=dt.year + 1, month=1)
                    else:
                        dt = dt.replace(month=dt.month + 1)
                sub.write({"recurring_next_date": dt.strftime("%Y-%m-%d")})
            except Exception:
                pass
