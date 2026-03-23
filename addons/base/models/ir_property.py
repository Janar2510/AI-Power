"""ir.property - company dependent defaults (Phase 431)."""

from core.orm import Model, fields


class IrProperty(Model):
    _name = "ir.property"
    _description = "Property"

    name = fields.Char(required=True, string="Name")
    fields_id = fields.Char(string="Field Technical Name")
    model = fields.Char(string="Model")
    company_id = fields.Many2one("res.company", string="Company")
    value_text = fields.Text(string="Value")
