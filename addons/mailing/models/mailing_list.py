"""mailing.list - Mailing list (Phase 207)."""

from core.orm import Model, fields


class MailingList(Model):
    _name = "mailing.list"
    _description = "Mailing List"

    name = fields.Char(string="Name", required=True)
    partner_ids = fields.One2many(
        "mailing.list.partner",
        "mailing_list_id",
        string="Subscribers",
    )
