"""Link stock moves to repair (Odoo mrp_repair parity)."""

from core.orm import Model, fields


class StockMove(Model):
    _inherit = "stock.move"

    repair_id = fields.Many2one("repair.order", string="Repair Order", ondelete="set null")
