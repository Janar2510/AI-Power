"""SMS template for mass sending."""

from core.orm import Model, fields


class SmsTemplate(Model):
    _name = "sms.template"
    _description = "SMS Template"

    name = fields.Char(string="Template Name", required=True)
    body = fields.Text(string="Body")
    model_id = fields.Many2one("ir.model", string="Applies to")
