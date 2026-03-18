"""mailing.list.partner - List membership with is_subscribed (Phase 207)."""

from core.orm import Model, fields


class MailingListPartner(Model):
    _name = "mailing.list.partner"
    _description = "Mailing List Subscriber"

    mailing_list_id = fields.Many2one("mailing.list", string="List", required=True, ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Partner", required=True, ondelete="cascade")
    is_subscribed = fields.Boolean(string="Subscribed", default=True)
