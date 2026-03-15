"""ir.translation - Translation storage (Phase 94)."""

from core.orm import Model, fields


class IrTranslation(Model):
    _name = "ir.translation"
    _description = "Translation"

    module = fields.Char(string="Module")
    lang = fields.Char(required=True, string="Language Code")
    src = fields.Text(string="Source")
    value = fields.Text(string="Translation")
    type = fields.Selection(
        selection=[
            ("model", "Model"),
            ("code", "Code"),
            ("view", "View"),
        ],
        default="code",
        string="Type",
    )
