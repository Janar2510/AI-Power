"""Barcode rule model (phase 308)."""

from core.orm import Model, fields


class BarcodeRule(Model):
    _name = "barcode.rule"
    _description = "Barcode Rule"

    name = fields.Char(string="Name", required=True)
    nomenclature_id = fields.Many2one("barcode.nomenclature", string="Nomenclature", ondelete="cascade")
    encoding = fields.Char(string="Encoding", default="any")
    pattern = fields.Char(string="Pattern", default=".*")
    type = fields.Char(string="Type", default="product")
    sequence = fields.Integer(string="Sequence", default=10)
