"""Extend res.users with digest_ids (Phase 251)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    digest_ids = fields.Many2many(
        "digest.digest",
        "digest_digest_res_users_rel",
        "user_id",
        "digest_id",
        string="Digests",
    )
