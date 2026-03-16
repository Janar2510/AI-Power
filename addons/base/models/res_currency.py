"""res.currency - Currency with rate conversion (Phase 96, 154)."""

from datetime import date
from typing import Any, Optional, Union

from core.orm import Model, fields


class ResCurrency(Model):
    _name = "res.currency"
    _description = "Currency"

    name = fields.Char(required=True, string="Currency Code", size=3)
    symbol = fields.Char(required=True, string="Symbol")
    rate = fields.Float(string="Rate", default=1.0)
    rate_ids = fields.One2many("res.currency.rate", "currency_id", string="Rates")

    def _get_rate(self, d: Optional[Union[date, str]] = None) -> float:
        """Get rate for date d. Default today. Falls back to rate field if no rate record."""
        cid = self.id if hasattr(self, "id") else (self._ids[0] if getattr(self, "_ids", None) else None)
        if not cid:
            return 1.0
        rate_model = self.env.get("res.currency.rate")
        if not rate_model:
            rows = self.read(["rate"]) if hasattr(self, "read") else []
            return float((rows[0].get("rate") if rows else None) or 1.0)
        d = d or date.today()
        if isinstance(d, str):
            d = date.fromisoformat(d[:10]) if d else date.today()
        rates = rate_model.search(
            [("currency_id", "=", cid), ("name", "<=", d.isoformat())],
            order="name desc",
            limit=1,
        )
        if rates and rates.ids:
            rows = rate_model.search_read([("id", "=", rates.ids[0])], ["rate"], limit=1)
            return float(rows[0].get("rate") or 1.0) if rows else 1.0
        rows = self.read(["rate"]) if hasattr(self, "read") else []
        return float((rows[0].get("rate") if rows else None) or 1.0)

    def _convert(
        self,
        amount: float,
        to_currency: Union["ResCurrency", int],
        d: Optional[Union[date, str]] = None,
    ) -> float:
        """Convert amount from self to to_currency."""
        if isinstance(to_currency, int):
            to_currency = self.env["res.currency"].browse(to_currency)
        if not to_currency or not to_currency.ids:
            return amount
        to_id = to_currency.ids[0] if to_currency.ids else None
        from_id = self.ids[0] if self.ids else None
        if from_id == to_id:
            return amount
        rate_from = self._get_rate(d)
        rate_to = to_currency._get_rate(d)
        if not rate_from:
            return amount
        return amount * (rate_to / rate_from)

    @classmethod
    def convert(
        cls,
        amount: float,
        from_currency_id: int,
        to_currency_id: int,
        d: Optional[Union[date, str]] = None,
    ) -> float:
        """Convert amount from one currency to another (Phase 154). Uses res.currency.rate for date."""
        if from_currency_id == to_currency_id:
            return amount
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return amount
        Currency = env.get("res.currency")
        if not Currency:
            return amount
        from_cur = Currency.browse(from_currency_id)
        to_cur = Currency.browse(to_currency_id)
        if not from_cur.ids or not to_cur.ids:
            return amount
        return from_cur._convert(amount, to_cur, d)
