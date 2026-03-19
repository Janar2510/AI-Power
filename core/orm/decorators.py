"""Phase 235: API decorators for ORM (onchange, ondelete, depends_context, autovacuum, etc.)."""

from typing import Callable, Any


def onchange(*field_names: str) -> Callable:
    """Decorator: mark method as onchange handler. Runs when any listed field changes in form."""
    def decorator(func: Callable) -> Callable:
        func._onchange_fields = field_names
        return func
    return decorator


def ondelete(at_uninstall: bool = False) -> Callable:
    """Decorator: mark method to run before unlink. at_uninstall=True runs during module uninstall."""
    def decorator(func: Callable) -> Callable:
        func._ondelete = True
        func._ondelete_at_uninstall = at_uninstall
        return func
    return decorator


def depends_context(*context_keys: str) -> Callable:
    """Decorator: mark compute method as depending on context keys (e.g. company, uid, active_test)."""
    def decorator(func: Callable) -> Callable:
        func._depends_context = list(context_keys)
        return func
    return decorator


def autovacuum() -> Callable:
    """Decorator: mark method for daily ir.autovacuum cron (cleanup, TTL, etc.)."""
    def decorator(func: Callable) -> Callable:
        func._autovacuum = True
        return func
    return decorator


def model_create_multi(func: Callable) -> Callable:
    """Decorator: create() accepts single dict or list of dicts. Method receives list of dicts."""
    func._model_create_multi = True
    return func


def model(func: Callable) -> Callable:
    """Decorator: model-level method (no recordset). First arg is cls, not self."""
    func._api_model = True
    return func


def private(func: Callable) -> Callable:
    """Decorator: method not callable via RPC (internal use only)."""
    func._api_private = True
    return func


def readonly(func: Callable) -> Callable:
    """Decorator: method can run with read-only cursor (no writes)."""
    func._api_readonly = True
    return func
