"""Mail group member model (phase 313)."""

from core.orm import Model, fields


class MailGroupMember(Model):
    _name = "mail.group.member"
    _description = "Mail Group Member"

    group_id = fields.Many2one("mail.group", string="Group", ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="cascade")
    status = fields.Selection(
        selection=[("active", "Active"), ("invited", "Invited")],
        string="Status",
        default="active",
    )
