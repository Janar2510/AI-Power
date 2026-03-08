"""CRM Lead model."""

from addons.base.models.mail_activity import MailActivityMixin
from addons.base.models.mail_message import MailThreadMixin
from core.orm import Model, fields


class CrmLead(MailActivityMixin, MailThreadMixin, Model):
    _name = "crm.lead"
    _description = "Lead/Opportunity"

    name = fields.Char(required=True)
    type = fields.Selection(
        selection=[("lead", "Lead"), ("opportunity", "Opportunity")],
        string="Type",
        default="lead",
    )
    partner_id = fields.Many2one("res.partner", string="Contact")
    partner_name = fields.Related("partner_id.name", store=True, string="Partner Name")
    stage_id = fields.Many2one("crm.stage", string="Stage")
    date_deadline = fields.Date(string="Deadline")
    expected_revenue = fields.Float()
    description = fields.Text()
    note_html = fields.Html(string="Notes")
    tag_ids = fields.Many2many("crm.tag", string="Tags")

    def action_mark_won(self):
        """Set stage to Won (Phase 76)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Stage = env.get("crm.stage")
        if not Stage:
            return
        won_stages = Stage.search([("is_won", "=", True)], limit=1)
        if won_stages and won_stages.ids:
            self.write({"stage_id": won_stages.ids[0]})
