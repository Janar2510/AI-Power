"""Phase 206: Check approval rules and auto-create approval.request chain on write/create."""


def check_approval_rules(env, model_name: str, record_ids: list, vals: dict, trigger: str = "write"):
    """When amount crosses min_amount threshold, create approval.request chain.
    trigger: 'write' or 'create'
    """
    if not env or not record_ids:
        return
    try:
        ApprovalRule = env.get("approval.rule")
        ApprovalRequest = env.get("approval.request")
        if not ApprovalRule or not ApprovalRequest:
            return
        rules = ApprovalRule.search([("model", "=", model_name), ("active", "=", True)])
        if not rules:
            return
        Model = env.get(model_name)
        if not Model:
            return
        amount_field = "amount_total"  # default
        for rule in rules:
            af = getattr(rule, "amount_field", None) or "amount_total"
            ft = getattr(rule, "field_trigger", None) or "state"
            min_amt = float(getattr(rule, "min_amount", 0) or 0)
            if trigger == "write" and ft not in vals and af not in vals:
                continue  # only check when trigger or amount field was written
            recs = Model.browse(record_ids)
            read_fields = ["id", af]
            try:
                rows = recs.read(read_fields)
            except Exception:
                continue
            for row in rows:
                rid = row.get("id")
                if rid is None:
                    continue
                amount = row.get(af)
                if amount is None:
                    amount = 0
                try:
                    amount = float(amount)
                except (TypeError, ValueError):
                    amount = 0
                if amount < min_amt:
                    continue
                existing = ApprovalRequest.search([
                    ("res_model", "=", model_name),
                    ("res_id", "=", rid),
                    ("rule_id", "=", rule.id),
                    ("state", "=", "pending"),
                ])
                if existing and existing.ids:
                    continue
                next_rule = getattr(rule, "parent_rule_id", None)
                next_rule_id = next_rule.ids[0] if next_rule and next_rule.ids else None
                ApprovalRequest.create({
                    "rule_id": rule.id,
                    "res_model": model_name,
                    "res_id": rid,
                    "step": 1,
                    "next_rule_id": next_rule_id,
                })
    except Exception:
        pass
