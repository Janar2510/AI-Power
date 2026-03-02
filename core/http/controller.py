"""Controller base and route decorator."""

import functools
from typing import Any, Callable, Dict, Optional

from werkzeug.wrappers import Response


_ROUTES: Dict[str, Dict[str, Any]] = {}  # path -> {methods, endpoint, auth}


def route(
    path: str,
    type: str = "http",
    auth: str = "user",
    methods: Optional[list] = None,
):
    """Decorator to register a route."""

    def decorator(f: Callable):
        _ROUTES[path] = {
            "methods": methods or ["GET"],
            "endpoint": f,
            "auth": auth,
            "type": type,
        }

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)

        return wrapper

    return decorator


class Controller:
    """Base class for HTTP controllers."""

    pass
