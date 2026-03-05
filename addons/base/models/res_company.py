"""res.company - Company (single-company stub for Phase 27)."""

from core.orm import Model, fields


class ResCompany(Model):
    _name = "res.company"
    _description = "Company"

    name = fields.Char(required=True, string="Company Name")
    currency_id = fields.Many2one("res.currency", string="Currency")
