"""account.tax - Tax definition and computation (Phase 181)."""

from typing import Any, Dict, List

from core.orm import Model, fields


class AccountTax(Model):
    _name = "account.tax"
    _description = "Tax"

    name = fields.Char(string="Name", required=True)
    amount = fields.Float(string="Amount", default=0.0, help="Percentage or fixed amount")
    amount_type = fields.Selection(
        selection=[
            ("percent", "Percentage"),
            ("fixed", "Fixed"),
        ],
        string="Type",
        default="percent",
    )
    type_tax_use = fields.Selection(
        selection=[
            ("sale", "Sales"),
            ("purchase", "Purchase"),
            ("none", "None"),
        ],
        string="Tax Scope",
        default="sale",
    )
    price_include = fields.Boolean(string="Included in Price", default=False)
    active = fields.Boolean(string="Active", default=True)

    def compute_all(self, price_unit: float, quantity: float = 1.0) -> Dict[str, Any]:
        """Compute tax amounts. Returns {total_excluded, total_included, taxes: [{name, amount}]}.

        Phase 536: single **percentage** tax with **price_include** treats ``price_unit * quantity``
        as tax-included.

        Phase 563: **multiple** percentage taxes all with **price_include** — sequential strip from
        gross (reverse application order), same result as single tax when len is 1.

        Phase 568: **mixed** percent+**price_include** with other taxes — strip included chain first
        (reverse document order), then apply remaining taxes on the untaxed base (Odoo-style).
        """
        if not self.ids:
            return {"total_excluded": price_unit * quantity, "total_included": price_unit * quantity, "taxes": []}
        rows = self.read(["name", "amount", "amount_type", "price_include"])
        gross = price_unit * quantity
        included_pct_idx = [
            (i, r)
            for i, r in enumerate(rows)
            if r.get("amount_type") == "percent" and r.get("price_include")
        ]
        other_idx = [
            (i, r)
            for i, r in enumerate(rows)
            if not (r.get("amount_type") == "percent" and r.get("price_include"))
        ]
        if included_pct_idx and other_idx:
            remaining = float(gross)
            tax_amounts: Dict[int, float] = {}
            for i, r in reversed(included_pct_idx):
                rate = (r.get("amount") or 0) / 100.0
                if rate <= -1.0:
                    tax_amounts[i] = 0.0
                    continue
                base_before = remaining / (1.0 + rate)
                tax_amt = remaining - base_before
                tax_amounts[i] = tax_amt
                remaining = base_before
            base = remaining
            for i, r in other_idx:
                amt = r.get("amount", 0) or 0
                if r.get("amount_type") == "percent":
                    tax_amounts[i] = base * (amt / 100.0)
                else:
                    tax_amounts[i] = float(amt) * quantity
            taxes_result = [{"name": rows[i].get("name", ""), "amount": tax_amounts[i]} for i in sorted(tax_amounts)]
            total_tax = sum(tax_amounts.values())
            return {
                "total_excluded": base,
                "total_included": base + total_tax,
                "taxes": taxes_result,
            }
        all_inc_pct = rows and all(
            (r.get("amount_type") == "percent" and r.get("price_include")) for r in rows
        )
        if all_inc_pct:
            remaining = float(gross)
            segments_rev: List[Dict[str, Any]] = []
            for r in reversed(rows):
                rate = (r.get("amount") or 0) / 100.0
                if rate <= -1.0:
                    segments_rev.append({"name": r.get("name", ""), "amount": 0.0})
                    continue
                base_before = remaining / (1.0 + rate)
                tax_amt = remaining - base_before
                segments_rev.append({"name": r.get("name", ""), "amount": tax_amt})
                remaining = base_before
            segments = list(reversed(segments_rev))
            return {
                "total_excluded": remaining,
                "total_included": gross,
                "taxes": segments,
            }
        base = gross
        taxes_result = []
        total_tax = 0.0
        for rec in rows:
            amt = rec.get("amount", 0) or 0
            if rec.get("amount_type") == "percent":
                tax_amount = base * (amt / 100.0)
            else:
                tax_amount = amt * quantity
            total_tax += tax_amount
            taxes_result.append({"name": rec.get("name", ""), "amount": tax_amount})
        return {
            "total_excluded": base,
            "total_included": base + total_tax,
            "taxes": taxes_result,
        }
