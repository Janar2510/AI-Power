"""Digest tip - helpful tips sent with digests (Phase 251)."""

from core.orm import Model, fields


class DigestTip(Model):
    _name = "digest.tip"
    _description = "Digest Tip"

    name = fields.Char(string="Name", required=True)
    tip_description = fields.Text(string="Tip Description")
    group_id = fields.Many2one("res.groups", string="Group")
