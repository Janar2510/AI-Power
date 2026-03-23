"""Safe expression evaluation helpers (Phase 404)."""

from typing import Any, Dict


_SAFE_GLOBALS = {
    "__builtins__": {},
    "len": len,
    "min": min,
    "max": max,
    "sum": sum,
    "sorted": sorted,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
}


def safe_eval(expr: str, context: Dict[str, Any] | None = None) -> Any:
    context = context or {}
    return eval(expr, _SAFE_GLOBALS, context)


def safe_exec(code: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Execute restricted Python code block with limited builtins."""
    ctx = dict(context or {})
    g = dict(_SAFE_GLOBALS)
    g.update(ctx)
    exec(code, g, g)
    return g
