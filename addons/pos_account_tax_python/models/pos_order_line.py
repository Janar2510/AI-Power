"""POS order line python tax flag (phase 341)."""

from core.orm import Model, fields


class PosOrderLine(Model):
    _inherit = "pos.order.line"

    tax_python_computed = fields.Boolean(string="Tax Python Computed", default=False)
