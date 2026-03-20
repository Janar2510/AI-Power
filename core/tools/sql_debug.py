"""SQL debug helpers (Phase 422)."""

import logging
from typing import Any, List, Sequence

_logger = logging.getLogger("erp.sql")


def explain_analyze(cr: Any, sql: str, params: Sequence[Any]) -> List[Any]:
    """Run EXPLAIN ANALYZE for a query; returns explain rows (best-effort)."""
    try:
        cr.execute(f"EXPLAIN ANALYZE {sql}", list(params))
        return list(cr.fetchall())
    except Exception as e:
        _logger.debug("EXPLAIN ANALYZE failed: %s", e)
        return []
