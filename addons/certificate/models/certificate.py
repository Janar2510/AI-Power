"""Certificate model (phase 329)."""

from core.orm import Model, fields


class Certificate(Model):
    _name = "certificate.certificate"
    _description = "Certificate"

    name = fields.Char(string="Name", default="")
    content = fields.Text(string="Content")
    date_start = fields.Date(string="Start Date")
    date_end = fields.Date(string="End Date")
    is_valid = fields.Boolean(string="Is Valid", default=True)
