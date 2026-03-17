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
        """Compute tax amounts. Returns {total_excluded, total_included, taxes: [{name, amount}]}."""
        if not self.ids:
            return {"total_excluded": price_unit * quantity, "total_included": price_unit * quantity, "taxes": []}
        base = price_unit * quantity
        taxes_result = []
        total_tax = 0.0
        for rec in self.read(["name", "amount", "amount_type", "price_include"]):
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
