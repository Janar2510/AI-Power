"""Structured (JSON) log lines for request tracing (Phase 517 + Track R2).

Usage:
    ERP_JSON_ACCESS_LOG=1  →  access logs emitted as JSON to stdout
    ERP_JSON_ERROR_LOG=1   →  error/exception logs emitted as JSON

Trace IDs:
    Every request generates or propagates an X-Request-ID / X-Trace-ID header.
    The ID is stored in threading.local() so any log call can include it without
    explicit propagation.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import threading
import uuid
from typing import Any, Dict, Optional

# ─── Thread-local trace context ───────────────────────────────────────────────
_ctx = threading.local()


def set_trace_id(trace_id: str) -> None:
    """Set the current request trace ID in thread-local storage."""
    _ctx.trace_id = trace_id


def get_trace_id() -> Optional[str]:
    """Return the current trace ID or None if not set."""
    return getattr(_ctx, "trace_id", None)


def generate_trace_id() -> str:
    """Generate a new random trace ID (UUID4, short form)."""
    return uuid.uuid4().hex[:16]


def clear_trace_id() -> None:
    _ctx.trace_id = None


# ─── Core formatter ───────────────────────────────────────────────────────────
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
    effective_trace = trace_id or get_trace_id()
    if effective_trace:
        payload["trace_id"] = effective_trace
    if extra:
        payload.update(extra)
    return json.dumps(payload, default=str)


# ─── Access log formatter ─────────────────────────────────────────────────────
def format_access_log(
    method: str,
    path: str,
    status: int,
    duration_ms: float,
    *,
    remote_addr: str = "-",
    content_length: int = 0,
    trace_id: Optional[str] = None,
) -> str:
    """Format an HTTP access log entry as JSON (Track R2)."""
    return format_json_log(
        f"{method} {path} → {status}",
        level="access",
        trace_id=trace_id,
        extra={
            "method": method,
            "path": path,
            "status": status,
            "duration_ms": round(duration_ms, 2),
            "remote_addr": remote_addr,
            "content_length": content_length,
        },
    )


# ─── Stdlib logging integration ───────────────────────────────────────────────
class JsonFormatter(logging.Formatter):
    """Python logging Formatter that emits single-line JSON records (Track R2).

    Install on any handler::

        handler.setFormatter(JsonFormatter())
    """

    def format(self, record: logging.LogRecord) -> str:
        level_map = {
            logging.DEBUG: "debug",
            logging.INFO: "info",
            logging.WARNING: "warning",
            logging.ERROR: "error",
            logging.CRITICAL: "critical",
        }
        level = level_map.get(record.levelno, "info")
        extra: Dict[str, Any] = {
            "logger": record.name,
        }
        if record.exc_info:
            import traceback
            extra["exc"] = "".join(traceback.format_exception(*record.exc_info))
        return format_json_log(
            record.getMessage(),
            level=level,
            extra=extra,
        )


def _json_logging_enabled() -> bool:
    raw = os.environ.get("ERP_JSON_ACCESS_LOG", "").strip().lower()
    return raw in ("1", "true", "yes", "on")


def install_json_log_handler(logger_name: str = "erp.access") -> logging.Logger:
    """Attach a JSON stdout handler to *logger_name* when ERP_JSON_ACCESS_LOG=1."""
    logger = logging.getLogger(logger_name)
    if _json_logging_enabled() and not any(
        isinstance(h, logging.StreamHandler) for h in logger.handlers
    ):
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
    return logger


# Eagerly install access logger so routes.py can ``from core.tools.json_log import _access_logger``
_access_logger = install_json_log_handler("erp.access")
_error_logger = install_json_log_handler("erp.error")
