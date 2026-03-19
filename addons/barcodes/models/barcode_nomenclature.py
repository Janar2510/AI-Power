"""Barcode nomenclature model (phase 308)."""

from core.orm import Model, fields


class BarcodeNomenclature(Model):
    _name = "barcode.nomenclature"
    _description = "Barcode Nomenclature"

    name = fields.Char(string="Name", required=True)
    rule_ids = fields.One2many("barcode.rule", "nomenclature_id", string="Rules")
