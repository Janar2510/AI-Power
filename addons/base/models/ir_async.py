"""ir.async - lightweight async job queue (Phase 427/430)."""

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from core.orm import Model, fields


class IrAsync(Model):
    _name = "ir.async"
    _description = "Asynchronous Job"

    name = fields.Char(string="Name")
    model = fields.Char(string="Model", required=True)
    method = fields.Char(string="Method", required=True)
    args_json = fields.Text(string="Args JSON")
    kwargs_json = fields.Text(string="Kwargs JSON")
    state = fields.Selection(
        [
            ("pending", "Pending"),
            ("running", "Running"),
            ("done", "Done"),
            ("failed", "Failed"),
        ],
        string="State",
        default="pending",
    )
    result_json = fields.Text(string="Result JSON")
    error = fields.Text(string="Error")
    user_id = fields.Integer(string="User ID")
    date_started = fields.Datetime(string="Started At")
    date_done = fields.Datetime(string="Done At")

    @classmethod
    def call(
        cls,
        model: str,
        method: str,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
        name: Optional[str] = None,
        env: Any = None,
    ):
        """Queue a background job."""
        args = args or []
        kwargs = kwargs or {}
        uid = getattr(env, "uid", 1) if env else 1
        vals = {
            "name": name or f"{model}.{method}",
            "model": model,
            "method": method,
            "args_json": json.dumps(args),
            "kwargs_json": json.dumps(kwargs),
            "state": "pending",
            "user_id": uid,
        }
        return cls.create(vals)

    @classmethod
    def call_notify(cls, env: Any = None) -> Dict[str, int]:
        """Return systray counters for async jobs."""
        pending = cls.search_count([("state", "=", "pending")])
        running = cls.search_count([("state", "=", "running")])
        failed = cls.search_count([("state", "=", "failed")])
        done = cls.search_count([("state", "=", "done")])
        return {"pending": pending, "running": running, "failed": failed, "done": done}

    @classmethod
    def run_pending(cls, limit: int = 20, env: Any = None) -> int:
        """Execute pending async jobs."""
        jobs = cls.search([("state", "=", "pending")], limit=limit, order="id asc")
        if not jobs or not jobs.ids:
            return 0
        count = 0
        for row in cls.browse(jobs.ids).read(["id", "model", "method", "args_json", "kwargs_json", "user_id"]):
            jid = row.get("id")
            if not jid:
                continue
            cls.browse(jid).write({"state": "running", "date_started": datetime.utcnow().isoformat(), "error": False})
            try:
                args = json.loads(row.get("args_json") or "[]")
                kwargs = json.loads(row.get("kwargs_json") or "{}")
                model_name = row.get("model")
                method_name = row.get("method")
                user_id = row.get("user_id") or 1
                run_env = env(user=user_id) if env else None
                M = run_env.get(model_name) if run_env and model_name else None
                if not M:
                    raise ValueError(f"Model not found: {model_name}")
                fn = getattr(M, method_name, None)
                if not callable(fn):
                    raise ValueError(f"Method not found: {model_name}.{method_name}")
                result = fn(*(args or []), **(kwargs or {}))
                cls.browse(jid).write(
                    {
                        "state": "done",
                        "result_json": json.dumps(result if result is not None else True, default=str),
                        "date_done": datetime.utcnow().isoformat(),
                    }
                )
                count += 1
            except Exception as e:
                cls.browse(jid).write(
                    {"state": "failed", "error": str(e), "date_done": datetime.utcnow().isoformat()}
                )
        return count

    @classmethod
    def gc_done(cls, days: int = 3, env: Any = None) -> int:
        """Delete old completed jobs."""
        cutoff = (datetime.utcnow() - timedelta(days=max(1, int(days)))).isoformat()
        recs = cls.search([("state", "in", ["done", "failed"]), ("date_done", "<", cutoff)], limit=10000)
        if not recs or not recs.ids:
            return 0
        n = len(recs.ids)
        recs.unlink()
        return n
