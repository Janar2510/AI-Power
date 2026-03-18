"""Phase 205: Generic audit log for model changes."""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from core.orm import Model, fields


class AuditLog(Model):
    _name = "audit.log"
    _description = "Audit Log"

    user_id = fields.Many2one("res.users", string="User")
    model = fields.Char(string="Model", required=True)
    res_id = fields.Integer(string="Record ID")
    operation = fields.Selection(
        selection=[("create", "Create"), ("write", "Write"), ("unlink", "Delete")],
        string="Operation",
        required=True,
    )
    old_values = fields.Text(string="Old Values")  # JSON
    new_values = fields.Text(string="New Values")  # JSON
    timestamp = fields.Datetime(string="Timestamp", default=lambda: datetime.utcnow().isoformat())


def log_audit(
    env,
    model: str,
    operation: str,
    res_ids: List[int],
    old_vals: Optional[Dict[int, Dict[str, Any]]] = None,
    new_vals: Optional[Dict[str, Any]] = None,
) -> None:
    """Write audit log entries. Phase 205."""
    if not env or not res_ids or operation not in ("create", "write", "unlink"):
        return
    try:
        AuditLogModel = env.get("audit.log")
        if not AuditLogModel:
            return
        uid = getattr(env, "uid", 1)
        old_vals = old_vals or {}
        new_vals = new_vals or {}
        for rid in res_ids:
            old_data = old_vals.get(rid, {})
            if operation == "create":
                new_data = new_vals
            elif operation == "write":
                new_data = dict(old_data)
                new_data.update(new_vals)
            else:
                new_data = {}
            old_json = json.dumps(old_data, default=str)[:32768] if old_data else ""
            new_json = json.dumps(new_data, default=str)[:32768] if new_data else ""
            AuditLogModel.create({
                "user_id": uid,
                "model": model,
                "res_id": rid,
                "operation": operation,
                "old_values": old_json,
                "new_values": new_json,
            })
    except Exception:
        pass
