"""approval.request - Pending approval requests (Phase 175)."""

from datetime import datetime

from core.orm import Model, fields


class ApprovalRequest(Model):
    _name = "approval.request"
    _description = "Approval Request"

    rule_id = fields.Many2one("approval.rule", string="Rule", required=True, ondelete="cascade")
    res_model = fields.Char(required=True, string="Model")
    res_id = fields.Integer(required=True, string="Record ID")
    step = fields.Integer(default=1, string="Step")  # Phase 206: current step in chain
    next_rule_id = fields.Many2one("approval.rule", string="Next Rule", ondelete="set null")  # Phase 206
    delegate_to_user_id = fields.Many2one("res.users", string="Delegated To", ondelete="set null")  # Phase 206
    state = fields.Selection(
        selection=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
        default="pending",
        string="Status",
    )
    approver_id = fields.Many2one("res.users", string="Approved By")
    approved_date = fields.Datetime(string="Approved Date")
    note = fields.Text(string="Note")
    requested_value = fields.Char(string="Requested Value")
    create_date = fields.Datetime(default=lambda: datetime.utcnow().isoformat(), string="Created")

    def action_approve(self):
        """Approve and optionally create next step in chain. Phase 206."""
        from datetime import datetime
        for rec in self:
            rec.write({
                "state": "approved",
                "approver_id": getattr(rec.env, "uid", 1),
                "approved_date": datetime.utcnow().isoformat(),
            })
            row = rec.read(["rule_id", "next_rule_id", "res_model", "res_id", "step"])
            if not row:
                continue
            r = row[0]

            def _m2o_id(v):
                if v is None or v is False:
                    return None
                if isinstance(v, (list, tuple)) and v:
                    return v[0]
                return int(v) if v else None

            rule_id = _m2o_id(r.get("rule_id"))
            next_rule_id = _m2o_id(r.get("next_rule_id"))
            if not rule_id and not next_rule_id:
                continue
            ApprovalRule = rec.env.get("approval.rule")
            if not ApprovalRule:
                continue
            nid = next_rule_id
            if not nid and rule_id:
                rule_row = ApprovalRule.browse(rule_id).read(["parent_rule_id"])
                if rule_row:
                    nid = _m2o_id(rule_row[0].get("parent_rule_id"))
            if not nid:
                continue
            nnid = None
            next_rule_row = ApprovalRule.browse(nid).read(["parent_rule_id"])
            if next_rule_row:
                nnid = _m2o_id(next_rule_row[0].get("parent_rule_id"))
            ApprovalRequest = rec.env.get("approval.request")
            if ApprovalRequest:
                ApprovalRequest.create({
                    "rule_id": nid,
                    "res_model": r.get("res_model", ""),
                    "res_id": r.get("res_id", 0),
                    "step": (r.get("step") or 1) + 1,
                    "next_rule_id": nnid,
                })

    def action_reject(self):
        """Reject the approval request. Phase 206."""
        from datetime import datetime
        self.write({
            "state": "rejected",
            "approver_id": getattr(self.env, "uid", 1),
            "approved_date": datetime.utcnow().isoformat(),
        })

    def action_delegate(self, user_id=None):
        """Delegate approval to another user. Phase 206. user_id from delegate_to_user_id if not passed."""
        uid = user_id or (self.delegate_to_user_id.id if self.delegate_to_user_id else None)
        if uid:
            self.write({"delegate_to_user_id": uid})
