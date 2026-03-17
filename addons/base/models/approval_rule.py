"""approval.rule - Generic approval workflow rules (Phase 175)."""

from core.orm import Model, fields


class ApprovalRule(Model):
    _name = "approval.rule"
    _description = "Approval Rule"

    name = fields.Char(required=True, string="Name")
    model = fields.Char(required=True, string="Model")
    field_trigger = fields.Char(string="Field to Approve", default="state")
    approver_user_id = fields.Many2one("res.users", string="Approver (User)")
    approver_group_id = fields.Many2one("res.groups", string="Approver (Group)")
    sequence = fields.Integer(default=10, string="Sequence")
    min_amount = fields.Float(string="Min Amount", default=0)
    amount_field = fields.Char(string="Amount Field", default="amount_total")
    active = fields.Boolean(default=True, string="Active")
