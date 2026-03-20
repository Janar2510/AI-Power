"""Website theme binding (phase 357)."""

from core.orm import Model, fields


class Website(Model):
    _inherit = "website"

    theme_id = fields.Many2one("website.theme", string="Theme", ondelete="set null")
