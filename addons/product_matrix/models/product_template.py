"""Product variant matrix helpers (phase 310)."""

from core.orm import Model


class ProductTemplate(Model):
    _inherit = "product.template"

    def _get_matrix(self):
        return []
