"""Per-database module registry. Tracks loaded modules."""

from typing import Any, Dict, List, Optional


class ModuleRegistry:
    """
    Per-database registry of loaded modules and models.
    Phase 4 will add model registration.
    """

    def __init__(self, db_name: str):
        self.db_name = db_name
        self._modules: List[str] = []
        self._models: Dict[str, Any] = {}

    def __getitem__(self, model_name: str) -> Any:
        """Get model class by name."""
        return self._models.get(model_name)

    def get(self, model_name: str, default: Any = None) -> Any:
        """Get model class by name."""
        return self._models.get(model_name, default)

    def register_model(self, model_name: str, model_class: Any) -> None:
        """Register a model class."""
        self._models[model_name] = model_class

    def register_module(self, module_name: str) -> None:
        """Register a loaded module."""
        if module_name not in self._modules:
            self._modules.append(module_name)

    @property
    def loaded_modules(self) -> List[str]:
        return self._modules.copy()
