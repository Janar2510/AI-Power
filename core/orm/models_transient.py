"""TransientModel - wizard/temporary records with auto-vacuum."""

import logging
from typing import Any, Type

from .models import ModelBase

_logger = logging.getLogger("erp.orm")


class TransientModel(ModelBase):
    """Base for transient (wizard) models. Records are short-lived and auto-vacuumed."""

    _transient = True
    _transient_max_count = 1000  # Keep at most N records; delete oldest when exceeded

    @classmethod
    def _transient_vacuum(cls) -> bool:
        """Delete old records when count exceeds _transient_max_count. Returns True if more to clean."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr or not cls._table:
            return False
        max_count = getattr(cls, "_transient_max_count", 1000) or 0
        if max_count <= 0:
            return False
        try:
            cr.execute(f'SELECT COUNT(*) FROM "{cls._table}"')
            row = cr.fetchone()
            count = row[0] if row else 0
        except Exception:
            return False
        if count <= max_count:
            return False
        to_delete = count - max_count
        cr.execute(
            f'SELECT id FROM "{cls._table}" ORDER BY id ASC LIMIT %s',
            (to_delete,),
        )
        ids = [r[0] for r in cr.fetchall()]
        if not ids:
            return False
        placeholders = ", ".join("%s" for _ in ids)
        cr.execute(f'DELETE FROM "{cls._table}" WHERE id IN ({placeholders})', ids)
        _logger.debug("Vacuumed %s: deleted %d old records", cls._name, len(ids))
        return len(ids) >= to_delete


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
