"""res.partner signup fields. Phase 256."""

import random
from datetime import datetime, timedelta, timezone

from core.orm import Model, fields


def _random_token():
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.SystemRandom().choice(chars) for _ in range(20))


class ResPartnerSignup(Model):
    _inherit = "res.partner"

    signup_token = fields.Char(string="Signup Token", copy=False)
    signup_type = fields.Char(string="Signup Token Type", copy=False)
    signup_expiration = fields.Datetime(string="Signup Expiration", copy=False)

    def signup_prepare(self, signup_type=None, expiration=None):
        """Generate signup token and set expiration."""
        self.ensure_one()
        token = _random_token()
        exp = expiration or (datetime.now(timezone.utc) + timedelta(days=3))
        self.write({
            "signup_token": token,
            "signup_type": signup_type or "signup",
            "signup_expiration": exp,
        })
        return token

    def _generate_signup_token(self):
        """Return valid signup token, creating one if needed."""
        self.ensure_one()
        now = datetime.now(timezone.utc)
        if self.signup_token and self.signup_expiration and self.signup_expiration > now:
            return self.signup_token
        return self.signup_prepare()
