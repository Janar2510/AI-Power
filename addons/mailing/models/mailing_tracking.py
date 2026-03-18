"""mailing.tracking - Per-recipient tracking token (Phase 207)."""

import secrets

from core.orm import Model, fields


class MailingTracking(Model):
    _name = "mailing.tracking"
    _description = "Mailing Tracking"

    mailing_id = fields.Many2one("mailing.mailing", string="Mailing", required=True, ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Partner", required=True, ondelete="cascade")
    token = fields.Char(string="Token", required=True)
    opened = fields.Boolean(string="Opened", default=False)
    clicked = fields.Boolean(string="Clicked", default=False)
