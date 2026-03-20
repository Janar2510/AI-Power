"""mail.followers — document followers (Phase 3a)."""

from core.orm import Model, fields


class MailFollowers(Model):
    _name = "mail.followers"
    _description = "Followers"
    _table = "mail_followers"

    res_model = fields.Char(required=True, string="Related Model")
    res_id = fields.Integer(required=True, string="Related Record ID")
    partner_id = fields.Many2one("res.partner", required=True, string="Partner", ondelete="cascade")
    subtype_ids = fields.Json(string="Subtype ids", default=list)
