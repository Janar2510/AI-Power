"""Sale PDF quote layout field (phase 311)."""

from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    pdf_quote_layout = fields.Selection(
        selection=[("standard", "Standard"), ("modern", "Modern")],
        string="PDF Quote Layout",
        default="standard",
    )
