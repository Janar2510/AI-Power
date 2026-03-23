"""ir.actions.server - Server actions (Phase 119)."""

from core.orm import Model, fields
from core.tools.safe_eval import safe_exec


class IrActionsServer(Model):
    _name = "ir.actions.server"
    _description = "Server Action"

    name = fields.Char(required=True, string="Action Name")
    state = fields.Selection(
        selection=[
            ("code", "Execute Python Code"),
            ("object_create", "Create a New Record"),
            ("object_write", "Update the Record"),
            ("multi", "Execute several actions"),
            ("email", "Send Email"),
        ],
        string="Action To Do",
        default="code",
    )
    code = fields.Text(string="Python Code")
    # For object_write: values to write (JSON or we use a simple format)
    # MVP: code handles object_write via record.write({...}) in code

    def run(self, records=None):
        """Execute server action. records = recordset that triggered (for object_write/code)."""
        records = records or (self.env.get("res.partner").browse([]) if self.env else None)
        for action in self:
            data = action.read(["state", "code"]) or [{}]
            vals = data[0] if data else {}
            state = vals.get("state")
            code = vals.get("code")
            if state == "code" and code:
                self._run_code(action, records, code)
            elif state == "object_write" and records:
                self._run_object_write(action, records)
            # object_create, multi, email: defer

    def _run_code(self, action, records, code: str = ""):
        """Execute Python code with env, record(s) in scope."""
        env = getattr(self, "env", None)
        if not env:
            return
        code = (code or "").strip()
        if not code:
            return
        rec = next(iter(records), None) if records and records.ids else None
        safe_context = {
            "env": env,
            "record": rec,
            "records": records,
            "log": lambda msg: None,
        }
        if not records or not records.ids:
            import logging
            logging.getLogger("erp.actions").warning("Server action: records empty, skipping")
            return
        try:
            safe_exec(code, safe_context)
        except Exception as e:
            import logging
            logging.getLogger("erp.actions").warning("Server action code failed: %s", e)

    def _run_object_write(self, action, records):
        """Write to records. Uses code if present, else no-op."""
        data = action.read(["code"]) or [{}]
        code = (data[0].get("code") or "").strip() if data else ""
        if code:
            self._run_code(action, records, code)

    @classmethod
    def run_server_action(cls, action_id, model=None, res_id=None, context=None):
        """Run server action and return optional follow-up action payload."""
        env = getattr(cls, "env", None)
        if not env:
            return {"ok": False, "error": "env missing"}
        action = cls.browse([int(action_id)])
        if not action or not action.ids:
            return {"ok": False, "error": "action not found"}
        records = None
        if model and res_id:
            try:
                records = env.get(model).browse([int(res_id)])
            except Exception:
                records = None
        action.run(records=records)
        return {"ok": True}
