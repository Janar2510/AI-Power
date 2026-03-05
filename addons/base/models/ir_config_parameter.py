"""ir.config_parameter - Key-value config storage (get_param/set_param)."""

from typing import Any, Optional

from core.orm import Model, fields


class IrConfigParameter(Model):
    _name = "ir.config_parameter"
    _description = "System Parameter"

    key = fields.Char(required=True, string="Key")
    value = fields.Text(string="Value")

    @classmethod
    def get_param(cls, key: str, default: Optional[Any] = None) -> Optional[str]:
        """Return value for key, or default if not found."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return default
        table = cls._table
        cr.execute(
            'SELECT "value" FROM "{}" WHERE "key" = %s LIMIT 1'.format(table),
            (key,),
        )
        row = cr.fetchone()
        if not row:
            return default
        val = row["value"] if hasattr(row, "keys") else row[0]
        return default if val is None else val

    @classmethod
    def set_param(cls, key: str, value: str) -> bool:
        """Create or update parameter. Returns True on success."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return False
        recs = cls.search([("key", "=", key)], limit=1)
        if recs and recs.ids:
            return cls.write_ids(recs.ids, {"value": value})
        return cls.create({"key": key, "value": value}) is not None
