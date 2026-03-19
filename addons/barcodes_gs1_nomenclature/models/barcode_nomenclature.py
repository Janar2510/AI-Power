"""GS1 barcode nomenclature extension (phase 308)."""

from core.orm import Model, fields


class BarcodeNomenclature(Model):
    _inherit = "barcode.nomenclature"

    is_gs1_nomenclature = fields.Boolean(string="Is GS1 Nomenclature", default=False)
