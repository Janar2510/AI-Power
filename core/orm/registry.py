"""ORM Registry - links to modules registry, holds model classes."""

import logging
from typing import Any, Dict, List, Optional, Type

from .models import ModelBase

_logger = logging.getLogger("erp.registry")


class Registry:
    """Registry of model classes. Per-database. Phase 210: deferred _inherit merge when base not yet registered."""

    def __init__(self, db_name: str):
        self.db_name = db_name
        self._models: Dict[str, Type[ModelBase]] = {}
        self._env: Optional[Any] = None
        self._pending_merges: List[tuple] = []  # [(model_name, extending_class, attrs), ...]

    def __getitem__(self, model_name: str) -> Type[ModelBase]:
        return self._models[model_name]

    def get(self, model_name: str, default: Any = None) -> Optional[Type[ModelBase]]:
        return self._models.get(model_name, default)

    def register_model(self, model_name: str, model_class: Type[ModelBase]) -> None:
        self._models[model_name] = model_class
        model_class._registry = self
        # Phase 210: process deferred merges that were waiting for this model
        still_pending = []
        for mname, ext_cls, attrs in self._pending_merges:
            if mname == model_name:
                self._do_merge(mname, ext_cls, attrs)
            else:
                still_pending.append((mname, ext_cls, attrs))
        self._pending_merges = still_pending

    def _do_merge(self, model_name: str, extending_class: Type[ModelBase], attrs: dict) -> None:
        """Apply merge of attrs into base model."""
        base = self._models.get(model_name)
        if base is None:
            return
        for attr_name, attr_val in attrs.items():
            if attr_name.startswith("__") or attr_name in ("_name", "_inherit", "_registry", "_table"):
                continue
            if attr_name == "_description" and not attr_val:
                continue
            setattr(base, attr_name, attr_val)
        _logger.debug("Merged _inherit=%s from %s", model_name, extending_class.__name__)

    def merge_model(self, model_name: str, extending_class: Type[ModelBase], attrs: dict) -> None:
        """Merge fields and methods from extending_class into existing model (extension inheritance). Phase 210: defer if base not yet registered."""
        base = self._models.get(model_name)
        if base is None:
            self._pending_merges.append((model_name, extending_class, attrs))
            _logger.debug("_inherit=%s: base not yet registered, deferred", model_name)
            return
        self._do_merge(model_name, extending_class, attrs)

    def set_env(self, env: Any) -> None:
        self._env = env

    def keys(self) -> List[str]:
        return list(self._models.keys())
