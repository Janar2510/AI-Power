"""Website publishing on jobs (phase 317)."""

from core.orm import Model, fields


class HrJob(Model):
    _inherit = "hr.job"

    website_published = fields.Boolean(string="Website Published", default=False)
    website_url = fields.Char(string="Website URL", default="")
