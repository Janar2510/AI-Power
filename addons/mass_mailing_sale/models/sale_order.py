"""Sale mass mailing attribution field (phase 330)."""

from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    mass_mailing_source_id = fields.Many2one("utm.source", string="Mass Mailing Source", ondelete="set null")
