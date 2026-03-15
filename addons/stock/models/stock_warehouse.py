"""Stock warehouse (Phase 116)."""

from core.orm import Model, fields


class StockWarehouse(Model):
    _name = "stock.warehouse"
    _description = "Warehouse"

    name = fields.Char(string="Warehouse", required=True)
    code = fields.Char(string="Short Name", size=5)
    lot_stock_id = fields.Many2one("stock.location", string="Stock Location")
    wh_output_stock_loc_id = fields.Many2one("stock.location", string="Output Location")
