"""auth.oauth.provider - OAuth2 provider config. Phase 257."""

from core.orm import Model, fields


class AuthOauthProvider(Model):
    """OAuth2 provider configuration."""

    _name = "auth.oauth.provider"
    _description = "OAuth2 Provider"
    _order = "sequence, name"

    name = fields.Char(string="Provider name", required=True)
    client_id = fields.Char(string="Client ID")
    auth_endpoint = fields.Char(string="Authorization URL", required=True)
    scope = fields.Char(default="openid profile email")
    validation_endpoint = fields.Char(string="UserInfo URL", required=True)
    enabled = fields.Boolean(string="Allowed", default=True)
    css_class = fields.Char(string="CSS class", default="fa fa-fw fa-sign-in text-primary")
    body = fields.Char(string="Login button label", required=True)
    sequence = fields.Integer(default=10)
