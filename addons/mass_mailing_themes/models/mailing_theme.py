"""Mass mailing theme model and bridge fields (phase 331)."""

from core.orm import Model, fields


class MailingTheme(Model):
    _name = "mailing.theme"
    _description = "Mailing Theme"

    name = fields.Char(string="Name", default="")
    template_html = fields.Text(string="Template HTML")


class MailingMailing(Model):
    _inherit = "mailing.mailing"

    theme_id = fields.Many2one("mailing.theme", string="Theme", ondelete="set null")
