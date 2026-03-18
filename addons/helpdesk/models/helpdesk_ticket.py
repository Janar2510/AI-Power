"""Helpdesk ticket (Phase 190)."""

from addons.mail.models.mail_thread import MailThreadMixin
from core.orm import Model, fields


class HelpdeskTicket(MailThreadMixin, Model):
    _name = "helpdesk.ticket"
    _description = "Helpdesk Ticket"

    name = fields.Char(required=True)
    partner_id = fields.Many2one("res.partner", string="Contact")
    user_id = fields.Many2one("res.users", string="Assignee")
    stage_id = fields.Many2one("helpdesk.stage", string="Stage")
    priority = fields.Selection(
        selection=[("0", "Low"), ("1", "Normal"), ("2", "High")],
        string="Priority",
        default="1",
    )
    deadline = fields.Date(string="SLA Deadline")
    description = fields.Text(string="Description")
