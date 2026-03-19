"""Company website SMS toggle (Phase 306)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    website_sms_enabled = fields.Boolean(string="Website SMS Enabled", default=False)
