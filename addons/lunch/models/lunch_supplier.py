"""lunch.supplier. Phase 260."""

from core.orm import Model, fields


class LunchSupplier(Model):
    _name = "lunch.supplier"
    _description = "Lunch Supplier"

    name = fields.Char(required=True)
    company_id = fields.Many2one("res.company")
    responsible_id = fields.Many2one("res.users", string="Responsible")
