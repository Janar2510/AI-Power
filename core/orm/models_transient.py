"""TransientModel - wizard/temporary records with auto-vacuum. Phase 213: TTL when create_date exists."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Type

from .models import ModelBase

_logger = logging.getLogger("erp.orm")


class TransientModel(ModelBase):
    """Base for transient (wizard) models. Records are short-lived and auto-vacuumed."""

    _transient = True
    _transient_max_count = 1000  # Keep at most N records; delete oldest when exceeded
    _transient_ttl_hours = 1  # Phase 213: Delete records older than N hours (when create_date column exists)

    @classmethod
    def _transient_vacuum(cls) -> bool:
        """Delete old records: TTL (when create_date exists) or count > max_count. Returns True if more to clean."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr or not cls._table:
            return False
        deleted = 0
        try:
            cr.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=%s AND column_name='create_date'",
                (cls._table,),
            )
            has_create_date = cr.fetchone() is not None
        except Exception:
            has_create_date = False
        ttl_hours = getattr(cls, "_transient_ttl_hours", 1) or 0
        if ttl_hours > 0 and has_create_date:
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=ttl_hours)).isoformat()
            try:
                cr.execute(f'DELETE FROM "{cls._table}" WHERE create_date::timestamp < %s', (cutoff,))
                deleted = cr.rowcount
                if deleted:
                    _logger.debug("Vacuumed %s: deleted %d records older than %s h", cls._name, deleted, ttl_hours)
            except Exception:
                pass
        max_count = getattr(cls, "_transient_max_count", 1000) or 0
        if max_count > 0 and deleted == 0:
            try:
                cr.execute(f'SELECT COUNT(*) FROM "{cls._table}"')
                row = cr.fetchone()
                count = row[0] if row else 0
            except Exception:
                count = 0
            if count > max_count:
                to_delete = count - max_count
                cr.execute(
                    f'SELECT id FROM "{cls._table}" ORDER BY id ASC LIMIT %s',
                    (to_delete,),
                )
                ids = [r[0] for r in cr.fetchall()]
                if ids:
                    placeholders = ", ".join("%s" for _ in ids)
                    cr.execute(f'DELETE FROM "{cls._table}" WHERE id IN ({placeholders})', ids)
                    deleted = len(ids)
                    _logger.debug("Vacuumed %s: deleted %d old records", cls._name, deleted)
        return deleted > 0


def vacuum_transient_models(env: Any) -> int:
    """Run vacuum on all registered transient models. Returns count of models vacuumed."""
    registry = getattr(env, "registry", None) if env else None
    if not registry:
        return 0
    count = 0
    for model_name, model_class in getattr(registry, "_models", {}).items():
        if getattr(model_class, "_transient", False):
            try:
                model_class._transient_vacuum()
                count += 1
            except Exception as e:
                _logger.warning("Transient vacuum %s failed: %s", model_name, e)
    return count
