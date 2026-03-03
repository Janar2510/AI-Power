"""API keys for JSON-2 auth - per-user bearer tokens."""

import hashlib
import secrets
from typing import Optional

from core.orm import Model, fields


class ResUsersApikeys(Model):
    _name = "res.users.apikeys"
    _description = "User API Keys"

    user_id = fields.Many2one("res.users", string="User", required=True)
    name = fields.Char(string="Description", default="API Key")
    key_hash = fields.Char(string="Key Hash")  # SHA256 of raw key

    @classmethod
    def _hash_key(cls, key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()

    @classmethod
    def generate(cls, user_id: int, name: str = "API Key") -> str:
        """Generate new API key. Returns raw key (show once)."""
        raw = secrets.token_urlsafe(32)
        h = cls._hash_key(raw)
        cls.create({"user_id": user_id, "name": name or "API Key", "key_hash": h})
        return raw

    @classmethod
    def revoke(cls, ids: list) -> bool:
        """Revoke API keys by id. Only revokes keys owned by current user."""
        if not ids:
            return True
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return False
        recs = cls.search_read([("id", "in", ids)], ["id", "user_id"])
        for r in recs:
            if r.get("user_id") == env.uid:
                cls.browse(r["id"]).unlink()
        return True

    @classmethod
    def _check_credentials(cls, env, key: str) -> Optional[int]:
        """Validate key, return user_id or None."""
        if not key or not str(key).strip():
            return None
        h = cls._hash_key(str(key).strip())
        cr = getattr(env, "cr", None) if env else None
        if not cr:
            return None
        try:
            cr.execute(
                "SELECT user_id FROM res_users_apikeys WHERE key_hash = %s",
                (h,),
            )
            row = cr.fetchone()
            return row[0] if row else None
        except Exception:
            return None
