"""Bill of Materials (Phase 153)."""

from core.orm import Model, fields


class MrpBomLine(Model):
    _name = "mrp.bom.line"
    _description = "BOM Line"

    bom_id = fields.Many2one("mrp.bom", string="Bill of Materials", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_qty = fields.Float(string="Quantity", default=1.0)


class MrpBom(Model):
    _name = "mrp.bom"
    _description = "Bill of Materials"

    name = fields.Char(string="Name", required=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_qty = fields.Float(string="Quantity", default=1.0)
    bom_line_ids = fields.One2many("mrp.bom.line", "bom_id", string="Components")
    operation_ids = fields.One2many("mrp.bom.operation", "bom_id", string="Operations")
    type = fields.Selection(
        selection=[
            ("normal", "Manufacture this product"),
            ("phantom", "Kit"),
        ],
        string="BOM Type",
        default="normal",
    )
