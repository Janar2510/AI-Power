"""Extend res.partner with accounting links (Phase 555)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    fiscal_position_id = fields.Many2one(
        "account.fiscal.position",
        string="Fiscal Position",
        help="Phase 555: default fiscal position on new sale/purchase orders for this partner.",
    )
