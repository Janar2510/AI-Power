"""Product email template field (phase 310)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    email_template_id = fields.Many2one("mail.template", string="Email Template", ondelete="set null")
