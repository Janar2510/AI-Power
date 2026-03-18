"""POS configuration (Phase 227)."""

from core.orm import Model, fields


class PosConfig(Model):
    _name = "pos.config"
    _description = "Point of Sale Configuration"

    name = fields.Char(string="Name", required=True)
    pricelist_id = fields.Many2one("product.pricelist", string="Pricelist")
    journal_id = fields.Many2one("account.journal", string="Journal", help="Cash journal for POS")
    warehouse_id = fields.Many2one("stock.warehouse", string="Warehouse")
    active = fields.Boolean(default=True)
