"""approval.request - Pending approval requests (Phase 175)."""

from datetime import datetime

from core.orm import Model, fields


class ApprovalRequest(Model):
    _name = "approval.request"
    _description = "Approval Request"

    rule_id = fields.Many2one("approval.rule", string="Rule", required=True, ondelete="cascade")
    res_model = fields.Char(required=True, string="Model")
    res_id = fields.Integer(required=True, string="Record ID")
    state = fields.Selection(
        selection=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
        default="pending",
        string="Status",
    )
    approver_id = fields.Many2one("res.users", string="Approved By")
    approved_date = fields.Datetime(string="Approved Date")
    note = fields.Text(string="Note")
    requested_value = fields.Char(string="Requested Value")
    create_date = fields.Datetime(default=lambda self: datetime.utcnow().isoformat(), string="Created")
