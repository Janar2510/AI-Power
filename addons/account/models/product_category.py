"""Extend product.category with stock accounting hints (Phase 581 Tier C depth)."""

from core.orm import Model, fields


class ProductCategory(Model):
    _inherit = "product.category"

    stock_cogs_account_id = fields.Many2one(
        "account.account",
        string="COGS account",
        help="Phase 583: optional expense account for stock Tier C draft moves.",
    )
    stock_valuation_account_id = fields.Many2one(
        "account.account",
        string="Stock valuation account",
        help="Phase 581: optional asset/counter account for stock Tier C draft moves.",
    )
