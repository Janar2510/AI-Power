"""res.users signup methods. Phase 256."""

from core.orm import Model, fields


class ResUsersSignup(Model):
    _inherit = "res.users"

    def signup(self, values, token=None):
        """Signup a user: create new or reset password with token.
        Returns (login, password)."""
        if token:
            Partner = self.env.get("res.partner")
            if not Partner:
                raise ValueError("res.partner not found")
            partner = Partner.search([("signup_token", "=", token)], limit=1)
            if not partner or not partner.ids:
                raise ValueError("Invalid or expired signup token")
            partner = partner[0]
            partner_user = self.search([("partner_id", "=", partner.id)], limit=1)
            if partner_user and partner_user.ids:
                partner_user.write({"password": values.get("password") or values.get("new_password")})
                partner.write({"signup_token": False, "signup_type": False})
                return (partner_user.read(["login"])[0].get("login") if partner_user.read(["login"]) else values.get("login"), values.get("password"))
            values["name"] = values.get("name") or partner.read(["name"])[0].get("name")
            values["partner_id"] = partner.id
            values["email"] = values.get("email") or values.get("login")
            new_user = self.create(values)
            partner.write({"signup_token": False, "signup_type": False})
            return (values.get("login"), values.get("password"))
        return (values.get("login"), values.get("password"))
