"""ORM Registry - links to modules registry, holds model classes."""

from typing import Any, Dict, List, Optional, Type

from .models import ModelBase


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

    def set_env(self, env: Any) -> None:
        self._env = env

    def keys(self) -> List[str]:
        return list(self._models.keys())
