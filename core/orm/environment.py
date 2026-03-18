"""Environment - request context with registry and user. Phase 219: su, with_context, with_user."""

import inspect
from typing import Any, Optional, Type, TypeVar

from .registry import Registry
from .models import ModelBase

T = TypeVar("T", bound=ModelBase)


class _ModelProxy:
    """Proxy that binds model to env for search/create. Phase 219."""

    def __init__(self, model: Type[ModelBase], env: "Environment"):
        self._model = model
        self._env = env

    def __getattr__(self, name: str) -> Any:
        attr = getattr(self._model, name)
        if not callable(attr):
            return attr

        def _bound(*args: Any, **kwargs: Any) -> Any:
            try:
                sig = inspect.signature(attr)
                if "env" in sig.parameters:
                    kwargs["env"] = self._env
            except (ValueError, TypeError):
                pass
            return attr(*args, **kwargs)

        return _bound


class Environment:
    """Environment - provides access to models and user context."""

    def __init__(
        self,
        registry: Registry,
        cr: Any = None,
        uid: int = 1,
        context: Optional[dict] = None,
        su: bool = False,
        _set_registry: bool = True,
    ):
        self.registry = registry
        self.cr = cr
        self.uid = uid
        self.context = context or {}
        self.su = su
        if _set_registry:
            registry.set_env(self)

    def __call__(
        self,
        user: Optional[int] = None,
        su: Optional[bool] = None,
        context: Optional[dict] = None,
    ) -> "Environment":
        """Return new Environment with overrides. Phase 219."""
        uid = user if user is not None else self.uid
        su_val = su if su is not None else self.su
        ctx = dict(self.context)
        if context:
            ctx.update(context)
        return Environment(
            registry=self.registry,
            cr=self.cr,
            uid=uid,
            context=ctx,
            su=su_val,
            _set_registry=False,
        )

    def __getitem__(self, model_name: str) -> Any:
        """Get model bound to this env (proxy for search/create with env)."""
        model = self.registry.get(model_name)
        if model is None:
            raise KeyError(model_name)
        return _ModelProxy(model, self)

    def get(self, model_name: str, default: Any = None) -> Any:
        model = self.registry.get(model_name, default)
        if model is None or model is default:
            return default
        return _ModelProxy(model, self)


SUPERUSER_ID = 1
