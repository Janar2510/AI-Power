"""Structured (JSON) log lines for request tracing — Phase 517."""

from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional


def format_json_log(
    message: str,
    *,
    level: str = "info",
    trace_id: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    """Return a single-line JSON object suitable for log aggregation."""
    payload: Dict[str, Any] = {
        "ts": time.time(),
        "level": level,
        "message": message,
    }
    if trace_id:
        payload["trace_id"] = trace_id
    if extra:
        payload.update(extra)
    return json.dumps(payload, default=str)
