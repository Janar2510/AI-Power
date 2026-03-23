"""report.paperformat model (Phase 430)."""

from core.orm import Model, fields


class ReportPaperformat(Model):
    _name = "report.paperformat"
    _description = "Report Paperformat"

    name = fields.Char(required=True, string="Name")
    format = fields.Selection(
        [
            ("A4", "A4"),
            ("Letter", "Letter"),
        ],
        string="Format",
        default="A4",
    )
    orientation = fields.Selection(
        [
            ("Portrait", "Portrait"),
            ("Landscape", "Landscape"),
        ],
        string="Orientation",
        default="Portrait",
    )
    margin_top = fields.Integer(string="Top Margin (mm)", default=10)
    margin_bottom = fields.Integer(string="Bottom Margin (mm)", default=10)
    margin_left = fields.Integer(string="Left Margin (mm)", default=7)
    margin_right = fields.Integer(string="Right Margin (mm)", default=7)
