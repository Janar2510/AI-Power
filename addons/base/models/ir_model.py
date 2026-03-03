"""ir.model - Model metadata. Stub for Odoo parity; table exists for extensibility."""

from core.orm import Model, fields


class IrModel(Model):
    _name = "ir.model"
    _description = "Models"

    name = fields.Char(string="Model Description")
    model = fields.Char(string="Model")
    info = fields.Text(string="Information")
