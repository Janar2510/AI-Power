"""Cloudflare Turnstile settings fields (phase 326)."""

from core.orm import Model, fields


class ResConfigSettings(Model):
    _inherit = "res.config.settings"

    cf_turnstile_site_key = fields.Char(string="CF Turnstile Site Key", default="")
    cf_turnstile_secret_key = fields.Char(string="CF Turnstile Secret Key", default="")
