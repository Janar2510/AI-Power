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


def summarize_slow_queries(entries: List[Any], threshold_ms: float = 100.0) -> List[str]:
    """Format (sql, duration_ms, ...) entries for structured logs / profiling (Phase 517)."""
    lines: List[str] = []
    for row in entries or []:
        try:
            if isinstance(row, (list, tuple)) and len(row) >= 2:
                sql, ms = row[0], float(row[1])
            elif isinstance(row, dict):
                sql = row.get("sql", "")
                ms = float(row.get("ms", 0))
            else:
                continue
            if ms >= threshold_ms:
                lines.append(f"{ms:.1f}ms {str(sql)[:200]}")
        except Exception:
            continue
    return lines
