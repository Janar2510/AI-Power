"""Partner social network URLs."""

from core.orm import Model, fields


class ResPartnerSocial(Model):
    _inherit = "res.partner"

    social_facebook = fields.Char(string="Facebook")
    social_twitter = fields.Char(string="X / Twitter")
    social_linkedin = fields.Char(string="LinkedIn")
    social_github = fields.Char(string="GitHub")
    social_instagram = fields.Char(string="Instagram")
