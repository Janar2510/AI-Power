"""AML value adjustment for subcontracting (Odoo mrp_subcontracting_account parity)."""

from core.orm import Model


class StockMove(Model):
    _inherit = "stock.move"

    def _get_aml_value(self):
        return 0.0
