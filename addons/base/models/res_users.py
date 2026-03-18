"""User model - for authentication (Phase 90 multi-company, Phase 98 portal)."""

from typing import Any, Dict, Optional

from core.orm import Model, fields
from core.http.auth import hash_password


class ResUsers(Model):
    _name = "res.users"
    _audit = True  # Phase 205
    _description = "User"
    _inherits = {"res.partner": "partner_id"}  # Phase 126: delegate name, email, etc. to partner

    login = fields.Char(required=True)
    password = fields.Char()
    active = fields.Boolean(default=True)
    partner_id = fields.Many2one("res.partner", string="Contact")
    company_id = fields.Many2one("res.company", string="Company")
    company_ids = fields.Many2many(
        "res.company",
        relation="res_users_res_company_rel",
        column1="user_id",
        column2="company_id",
        string="Allowed Companies",
    )
    group_ids = fields.Many2many(
        "res.groups",
        relation="res_users_res_groups_rel",
        column1="user_id",
        column2="group_id",
        string="Groups",
    )

    @classmethod
    def _create_portal_user(
        cls,
        env: Any,
        name: str,
        login: str,
        password: str,
        email: Optional[str] = None,
    ) -> Optional[int]:
        """Create a portal user with base.group_portal. Creates res.partner first.
        Returns user id or None on failure."""
        User = env.get("res.users")
        Partner = env.get("res.partner")
        Groups = env.get("res.groups")
        if not User or not Partner or not Groups:
            return None
        existing = User.search([("login", "=", login)])
        if existing and existing.ids:
            return None
        partner = Partner.create({
            "name": name,
            "email": email or login,
            "type": "contact",
        })
        if not partner or not partner.ids:
            return None
        group_portal = Groups.search([("full_name", "=", "base.group_portal")], limit=1)
        if not group_portal or not group_portal.ids:
            return None
        user_vals: Dict[str, Any] = {
            "name": name,
            "login": login,
            "password": hash_password(password),
            "email": email or login,
            "partner_id": partner.ids[0],
            "company_id": None,
        }
        user_vals["group_ids"] = [(6, 0, group_portal.ids)]
        user = User.create(user_vals)
        if not user or not user.ids:
            return None
        Partner.browse([partner.ids[0]]).write({"user_id": user.ids[0]})
        return user.ids[0]
