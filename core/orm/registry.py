"""ORM Registry - links to modules registry, holds model classes."""

import logging
from typing import Any, Dict, List, Optional, Type

from .models import ModelBase

_logger = logging.getLogger("erp.registry")


class Registry:
    """Registry of model classes. Per-database."""

    def __init__(self, db_name: str):
        self.db_name = db_name
        self._models: Dict[str, Type[ModelBase]] = {}
        self._env: Optional[Any] = None

    def __getitem__(self, model_name: str) -> Type[ModelBase]:
        return self._models[model_name]

    def get(self, model_name: str, default: Any = None) -> Optional[Type[ModelBase]]:
        return self._models.get(model_name, default)

    def register_model(self, model_name: str, model_class: Type[ModelBase]) -> None:
        self._models[model_name] = model_class
        model_class._registry = self

    def merge_model(self, model_name: str, extending_class: Type[ModelBase], attrs: dict) -> None:
        """Merge fields and methods from extending_class into existing model (extension inheritance)."""
        from .models import ModelBase as _MB
        from core.orm import fields as fmod
        base = self._models.get(model_name)
        if base is None:
            _logger.warning("_inherit=%s: base model not yet registered, deferring", model_name)
            return
        for attr_name, attr_val in attrs.items():
            if attr_name.startswith("__") or attr_name in ("_name", "_inherit", "_registry", "_table"):
                continue
            if attr_name == "_description" and not attr_val:
                continue
            setattr(base, attr_name, attr_val)
        _logger.debug("Merged _inherit=%s from %s", model_name, extending_class.__name__)

    def set_env(self, env: Any) -> None:
        self._env = env

    def keys(self) -> List[str]:
        return list(self._models.keys())
