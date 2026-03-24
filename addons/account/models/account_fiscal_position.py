"""Fiscal positions — minimal tax mapping (Phase 546 / Wave M).

Odoo-style: ``account.fiscal.position`` + lines mapping source tax → destination tax.
Applied explicitly via ``sale.order.apply_fiscal_position_taxes`` (no automatic partner rules in this slice).
"""

from __future__ import annotations

from typing import Any, Dict, List

from core.orm import Model, fields


class AccountFiscalPosition(Model):
    _name = "account.fiscal.position"
    _description = "Fiscal Position"

    name = fields.Char(string="Name", required=True)
    active = fields.Boolean(string="Active", default=True)

    @classmethod
    def map_tax_ids(cls, env: Any, position_id: int, tax_ids: List[int]) -> List[int]:
        """Return tax ids with fiscal mappings applied (unknown taxes unchanged)."""
        if not position_id or not tax_ids:
            return list(tax_ids)
        Line = env.get("account.fiscal.position.tax") if env else None
        if not Line:
            return list(tax_ids)
        rows = Line.search_read(
            [("fiscal_position_id", "=", position_id)],
            ["tax_src_id", "tax_dest_id"],
        )
        mp: Dict[int, int] = {}
        for row in rows:
            src = row.get("tax_src_id")
            dst = row.get("tax_dest_id")
            sid = src[0] if isinstance(src, (list, tuple)) and src else src
            did = dst[0] if isinstance(dst, (list, tuple)) and dst else dst
            if sid and did:
                mp[int(sid)] = int(did)
        return [mp.get(int(t), int(t)) for t in tax_ids]


class AccountFiscalPositionTax(Model):
    _name = "account.fiscal.position.tax"
    _description = "Fiscal Position Tax Mapping"

    fiscal_position_id = fields.Many2one(
        "account.fiscal.position",
        string="Fiscal Position",
        required=True,
        ondelete="cascade",
    )
    tax_src_id = fields.Many2one("account.tax", string="Source Tax", required=True, ondelete="cascade")
    tax_dest_id = fields.Many2one("account.tax", string="Destination Tax", required=True, ondelete="cascade")
