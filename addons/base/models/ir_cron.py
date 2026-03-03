"""Scheduled jobs - interval-based cron."""

from datetime import datetime, timedelta

from core.orm import Model, fields


class IrCron(Model):
    _name = "ir.cron"
    _description = "Scheduled Action"

    name = fields.Char(string="Name", required=True)
    model = fields.Char(string="Model", required=True)
    method = fields.Char(string="Method", required=True)
    interval_minutes = fields.Integer(string="Interval (minutes)", default=60)
    next_run = fields.Datetime(string="Next Run")
    active = fields.Boolean(string="Active", default=True)

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
            ["id", "name", "model", "method", "interval_minutes"]
        ):
            model_name = rec.get("model")
            method_name = rec.get("method")
            interval = rec.get("interval_minutes") or 60
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
            except Exception:
                pass
            next_run = now + timedelta(minutes=interval)
            cls.browse(rec["id"]).write({"next_run": next_run.isoformat()})
        return count
