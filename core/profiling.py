"""Request profiling and ORM query stats (Phase 144)."""

import time
from contextvars import ContextVar
from typing import Any, Dict, Optional

_request_start: ContextVar[Optional[float]] = ContextVar("profiling_request_start", default=None)
_query_count: ContextVar[int] = ContextVar("profiling_query_count", default=0)
_query_time_ms: ContextVar[float] = ContextVar("profiling_query_time_ms", default=0.0)


def init_request_profiling() -> None:
    """Initialize profiling for current request. Call at request start."""
    _request_start.set(time.perf_counter())
    _query_count.set(0)
    _query_time_ms.set(0.0)


def record_query(duration_seconds: float) -> None:
    """Record one ORM/DB query. Call from instrumented cursor."""
    try:
        _query_count.set(_query_count.get() + 1)
        _query_time_ms.set(_query_time_ms.get() + duration_seconds * 1000)
    except LookupError:
        pass


def get_request_duration_ms() -> Optional[float]:
    """Get elapsed time since init_request_profiling, in milliseconds."""
    start = _request_start.get()
    if start is None:
        return None
    return (time.perf_counter() - start) * 1000


def get_profiling_stats() -> Dict[str, Any]:
    """Get profiling stats for current request."""
    return {
        "request_ms": get_request_duration_ms(),
        "query_count": _query_count.get(),
        "query_time_ms": _query_time_ms.get(),
    }


def wrap_cursor_for_profiling(cursor: Any) -> Any:
    """Wrap cursor.execute to record query count and timing."""
    _original_execute = cursor.execute

    def profiled_execute(query, vars=None):
        t0 = time.perf_counter()
        try:
            return _original_execute(query, vars)
        finally:
            record_query(time.perf_counter() - t0)

    cursor.execute = profiled_execute
    return cursor
