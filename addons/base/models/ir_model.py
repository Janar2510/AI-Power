"""ir.model - Model metadata. Stub for Odoo parity; table exists for extensibility."""

from core.orm import Model, fields


class IrModel(Model):
    _name = "ir.model"
    _description = "Models"

    name = fields.Char(string="Model Description")
    model = fields.Char(string="Model")
    info = fields.Text(string="Information")
    state = fields.Selection(
        selection=[("base", "Base"), ("manual", "Manual")],
        string="Type",
        default="base",
    )
    field_id = fields.One2many("ir.model.fields", "model_id", string="Fields")
    access_ids = fields.One2many("ir.model.access", "model_id", string="Access Controls")
