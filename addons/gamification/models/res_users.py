"""Extend users with karma and rank."""

from core.orm import Model, fields


class ResUsersGamification(Model):
    _inherit = "res.users"

    karma = fields.Integer(string="Karma", default=0)
    rank_id = fields.Many2one("gamification.karma.rank", string="Rank")
