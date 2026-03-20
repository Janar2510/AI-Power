"""Website theme model (phase 357)."""

from core.orm import Model, fields


class WebsiteTheme(Model):
    _name = "website.theme"
    _description = "Website Theme"

    name = fields.Char(string="Name", default="")
    description = fields.Text(string="Description")
    primary_color = fields.Char(string="Primary Color", default="var(--color-primary)")
    scss_variables = fields.Text(string="SCSS Variables")
    active = fields.Boolean(string="Active", default=True)
