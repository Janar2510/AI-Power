"""Payment terms (Phase 191)."""

from datetime import datetime, timedelta
from core.orm import Model, fields


class AccountPaymentTerm(Model):
    _name = "account.payment.term"
    _description = "Payment Term"

    name = fields.Char(required=True)
    line_ids = fields.One2many(
        "account.payment.term.line",
        "payment_id",
        string="Terms",
    )

    def compute(self, value, date_ref=None):
        """Return list of (amount, due_date) for given total value and reference date."""
        if value <= 0:
            return []
        if date_ref is None:
            date_ref = datetime.utcnow().date()
        if isinstance(date_ref, str):
            try:
                date_ref = datetime.fromisoformat(date_ref.replace("Z", "+00:00")).date()
            except Exception:
                date_ref = datetime.utcnow().date()
        env = getattr(self, "env", None) or (
            getattr(self._model._registry, "_env", None)
            if getattr(self._model, "_registry", None)
            else None
        )
        if not env:
            return []
        Line = env.get("account.payment.term.line")
        if not Line:
            return []
        ids = self.ids if hasattr(self, "ids") and self.ids else (getattr(self, "_ids", None) or [])
        if not ids:
            ids = [self.id] if hasattr(self, "id") and self.id else []
        if not ids:
            return []
        lines = Line.search([("payment_id", "=", ids[0])], order="sequence, id")
        if not lines or not lines.ids:
            return [(value, date_ref.isoformat())]
        result = []
        remaining = float(value)
        for line in lines:
            row = line.read(["value", "value_amount", "days", "day_of_month", "sequence"])[0] if line.read(["value", "value_amount", "days", "day_of_month", "sequence"]) else {}
            val_type = row.get("value") or "balance"
            val_amt = float(row.get("value_amount") or 0)
            days = int(row.get("days") or 0)
            dom = row.get("day_of_month")
            if dom is not None:
                try:
                    dom = int(dom)
                except (TypeError, ValueError):
                    dom = None
            if val_type == "balance":
                amt = remaining
            elif val_type == "percent":
                amt = value * (val_amt / 100.0)
            elif val_type == "fixed":
                amt = val_amt
            else:
                amt = remaining
            if amt <= 0:
                continue
            remaining -= amt
            due = date_ref + timedelta(days=days)
            if dom is not None and 1 <= dom <= 28:
                try:
                    due = due.replace(day=dom)
                except ValueError:
                    pass
            result.append((amt, due.isoformat()))
        return result


class AccountPaymentTermLine(Model):
    _name = "account.payment.term.line"
    _description = "Payment Term Line"

    payment_id = fields.Many2one("account.payment.term", string="Payment Term", required=True, ondelete="cascade")
    value = fields.Selection(
        selection=[
            ("balance", "Balance"),
            ("percent", "Percent"),
            ("fixed", "Fixed Amount"),
        ],
        string="Type",
        default="balance",
    )
    value_amount = fields.Float(string="Value", default=0.0)
    days = fields.Integer(string="Days", default=0)
    day_of_month = fields.Integer(string="Day of Month")
    sequence = fields.Integer(default=10)
