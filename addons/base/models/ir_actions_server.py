"""ir.actions.server - Server actions (Phase 119)."""

from core.orm import Model, fields


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
            if action.state == "code" and action.code:
                self._run_code(action, records)
            elif action.state == "object_write" and records:
                self._run_object_write(action, records)
            # object_create, multi, email: defer

    def _run_code(self, action, records):
        """Execute Python code with env, record(s) in scope."""
        env = getattr(self, "env", None)
        if not env:
            return
        # Get code from recordset (self) since we're iterating over server actions
        code = ""
        if self.ids:
            data = self.read(["code"])
            if data:
                code = data[0].get("code") or ""
        if not code:
            return
        rec = records.browse(records.ids[0]) if records and records.ids else None
        safe_builtins = {
            "env": env,
            "record": rec,
            "records": records,
            "log": lambda msg: None,
        }
        import builtins
        exec_globals = {"__builtins__": builtins.__dict__, **safe_builtins}
        try:
            exec(code, exec_globals, exec_globals)
        except Exception as e:
            import logging
            logging.getLogger("erp.actions").warning("Server action code failed: %s", e)

    def _run_object_write(self, action, records):
        """Write to records. Uses code if present, else no-op."""
        if action.code:
            self._run_code(action, records)
