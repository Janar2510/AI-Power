"""Environment - request context with registry and user."""

from typing import Any, Optional, Type, TypeVar

from .registry import Registry
from .models import ModelBase

T = TypeVar("T", bound=ModelBase)


class Environment:
    """Environment - provides access to models and user context."""

    def __init__(
        self,
        registry: Registry,
        cr: Any = None,
        uid: int = 1,
        context: Optional[dict] = None,
    ):
        self.registry = registry
        self.cr = cr
        self.uid = uid
        self.context = context or {}
        registry.set_env(self)

    def __getitem__(self, model_name: str) -> Type[ModelBase]:
        """Get model class by name."""
        return self.registry[model_name]

    def get(self, model_name: str, default: Any = None) -> Any:
        return self.registry.get(model_name, default)


SUPERUSER_ID = 1
