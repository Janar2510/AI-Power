"""Mass mailing core models (phase 330)."""

from core.orm import Model, fields


class MailingMailing(Model):
    _name = "mailing.mailing"
    _description = "Mass Mailing"

    subject = fields.Char(string="Subject", default="")
    body_html = fields.Text(string="Body HTML")
    mailing_model_id = fields.Char(string="Mailing Model", default="")
    contact_list_ids = fields.Many2many(
        "mailing.list",
        "mailing_mailing_list_rel",
        "mailing_id",
        "list_id",
        string="Contact Lists",
    )
    state = fields.Selection(
        selection=[("draft", "Draft"), ("in_queue", "In Queue"), ("sent", "Sent"), ("cancel", "Cancelled")],
        string="State",
        default="draft",
    )
    sent_date = fields.Datetime(string="Sent Date")
    event_id = fields.Many2one("event.event", string="Event", ondelete="set null")


class MailingContact(Model):
    _name = "mailing.contact"
    _description = "Mailing Contact"

    name = fields.Char(string="Name", default="")
    email = fields.Char(string="Email", default="")
    list_ids = fields.Many2many(
        "mailing.list",
        "mailing_contact_list_rel",
        "contact_id",
        "list_id",
        string="Lists",
    )
    subscription_list_ids = fields.Many2many(
        "mailing.list",
        "mailing_contact_subscription_list_rel",
        "contact_id",
        "list_id",
        string="Subscription Lists",
    )
    opt_out = fields.Boolean(string="Opt Out", default=False)


class MailingList(Model):
    _name = "mailing.list"
    _description = "Mailing List"

    name = fields.Char(string="Name", default="")
    contact_ids = fields.Many2many(
        "mailing.contact",
        "mailing_list_contact_rel",
        "list_id",
        "contact_id",
        string="Contacts",
    )
    is_public = fields.Boolean(string="Public", default=False)


class MailingTrace(Model):
    _name = "mailing.trace"
    _description = "Mailing Trace"

    mailing_id = fields.Many2one("mailing.mailing", string="Mailing", ondelete="cascade")
    email = fields.Char(string="Email", default="")
    trace_type = fields.Selection(
        selection=[("mail", "Mail"), ("sms", "SMS")],
        string="Trace Type",
        default="mail",
    )
    sent_datetime = fields.Datetime(string="Sent Datetime")
    open_datetime = fields.Datetime(string="Open Datetime")
    links_click_datetime = fields.Datetime(string="Links Click Datetime")
