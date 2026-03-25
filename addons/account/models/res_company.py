"""Extend res.company with accounting controls (Phase 557)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    account_lock_date = fields.Date(
        string="Lock Date for Non-Advisers",
        help="Phase 557: block posting journal entries with date on or before this date (single-company heuristic).",
    )
    account_lock_adviser_group_id = fields.Many2one(
        "res.groups",
        string="Lock bypass group",
        help="Phase 584: users in this group may post on/before account_lock_date.",
    )
