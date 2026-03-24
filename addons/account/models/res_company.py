"""Extend res.company with accounting controls (Phase 557)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    account_lock_date = fields.Date(
        string="Lock Date for Non-Advisers",
        help="Phase 557: block posting journal entries with date on or before this date (single-company heuristic).",
    )
