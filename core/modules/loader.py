"""Module loading - load Python packages and data files."""

import importlib.util
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.tools import config

from .module import get_manifest, get_module_path, get_modules, resolve_load_order

_logger = logging.getLogger("erp.modules")


def clear_loaded_addon_modules() -> None:
    """Clear cached addon packages so models register against the current registry."""
    to_clear = [name for name in list(sys.modules) if name.startswith("addons.")]
    for name in to_clear:
        del sys.modules[name]


def _ensure_addons_on_path() -> None:
    """Ensure project root (addons parent) is on sys.path."""
    from core.tools import config
    paths = config.get_addons_paths()
    if paths:
        root = paths[0].parent
        root_str = str(root)
        if root_str not in sys.path:
            sys.path.insert(0, root_str)


def load_openerp_module(module_name: str) -> Optional[Any]:
    """Load a module's Python package. Returns the module or None."""
    path = get_module_path(module_name)
    if path is None:
        _logger.warning("Module %s not found", module_name)
        return None

    _ensure_addons_on_path()

    # Import as addons.<module_name>
    pkg_name = f"addons.{module_name}"
    try:
        spec = importlib.util.spec_from_file_location(
            pkg_name,
            path / "__init__.py",
            submodule_search_locations=[str(path)],
        )
        if spec is None or spec.loader is None:
            return None
        mod = importlib.util.module_from_spec(spec)
        sys.modules[pkg_name] = mod
        spec.loader.exec_module(mod)
        return mod
    except Exception as e:
        _logger.exception("Failed to load module %s: %s", module_name, e)
        return None


def load_module_graph(
    module_names: Optional[List[str]] = None,
    server_wide: Optional[List[str]] = None,
) -> List[str]:
    """
    Load modules in dependency order.
    Returns list of successfully loaded module names.
    """
    if module_names is None:
        module_names = get_modules()

    if server_wide is None:
        server_wide = config.get_config().get(
            "server_wide_modules",
            ["base", "rpc", "web"],
        )

    # Ensure server-wide modules are included
    to_load = list(dict.fromkeys(server_wide + [m for m in module_names if m not in server_wide]))
    to_load = [m for m in to_load if m in get_modules() or m in server_wide]

    order = resolve_load_order(to_load)
    loaded: List[str] = []

    for name in order:
        if get_module_path(name) is None:
            _logger.debug("Skipping %s (not in addons path)", name)
            continue
        if load_openerp_module(name):
            loaded.append(name)

    return loaded
