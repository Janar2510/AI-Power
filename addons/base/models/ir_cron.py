"""Scheduled jobs - interval-based cron (Phase 4a: failures, NOTIFY wake)."""

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from core.orm import Model, fields

_logger = logging.getLogger("erp.ir_cron")

_NOTIFY = "erp_cron_wake"


class IrCron(Model):
    _name = "ir.cron"
    _description = "Scheduled Action"

    name = fields.Char(string="Name", required=True)
    model = fields.Char(string="Model", required=True)
    method = fields.Char(string="Method", required=True)
    interval_minutes = fields.Integer(string="Interval (minutes)", default=60)
    next_run = fields.Datetime(string="Next Run")
    active = fields.Boolean(string="Active", default=True)
    failure_count = fields.Integer(string="Consecutive failures", default=0)
    max_failures = fields.Integer(string="Deactivate after N failures", default=5)

    @classmethod
    def _trigger(cls, env: Any, cron_id: Optional[int] = None) -> None:
        """Notify in-process cron thread to run soon (Phase 4a)."""
        cr = getattr(env, "cr", None)
        if not cr:
            return
        try:
            cr.execute("SELECT pg_notify(%s, %s)", (_NOTIFY, str(cron_id or "")))
        except Exception as e:
            _logger.debug("pg_notify cron wake failed: %s", e)

    @classmethod
    def run_due(cls, env) -> int:
        """Run all due crons. Returns count of crons executed."""
        env.registry.set_env(env)
        now = datetime.utcnow()
        recs = cls.search(
            [
                ("active", "=", True),
                ("next_run", "<=", now.isoformat()),
            ],
            limit=100,
        )
        if not recs.ids:
            return 0
        count = 0
        for rec in cls.browse(recs.ids).read(
            ["id", "name", "model", "method", "interval_minutes", "failure_count", "max_failures"]
        ):
            model_name = rec.get("model")
            method_name = rec.get("method")
            interval = rec.get("interval_minutes") or 60
            cid = rec.get("id")
            fails = rec.get("failure_count") or 0
            max_f = rec.get("max_failures") or 5
            if not model_name or not method_name:
                continue
            ModelClass = env.get(model_name)
            if ModelClass is None:
                continue
            fn = getattr(ModelClass, method_name, None)
            if fn is None:
                continue
            try:
                fn()
                count += 1
                cls.browse(cid).write({"failure_count": 0, "next_run": (now + timedelta(minutes=interval)).isoformat()})
            except Exception as e:
                _logger.warning("Cron %s failed: %s", rec.get("name"), e)
                fails += 1
                vals = {"failure_count": fails, "next_run": (now + timedelta(minutes=interval)).isoformat()}
                if max_f and fails >= max_f:
                    vals["active"] = False
                cls.browse(cid).write(vals)
        return count
