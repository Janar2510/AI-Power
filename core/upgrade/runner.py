"""Upgrade script runner - migrate(cr, version) contract."""

import importlib.util
import logging
from pathlib import Path
from typing import Any, Optional

_logger = logging.getLogger("erp.upgrade")


def run_migrate(
    cr: Any,
    module_name: str,
    version: str,
    upgrades_path: Optional[Path] = None,
) -> bool:
    """
    Run migrate(cr, version) for a module.
    cr: database cursor (or mock)
    module_name: module to upgrade
    version: target version string
    upgrades_path: path to upgrades directory (default: module/upgrades/)
    Returns True if migration ran, False otherwise.
    """
    if upgrades_path is None:
        from core.modules.module import get_module_path
        mod_path = get_module_path(module_name)
        if mod_path is None:
            return False
        upgrades_path = mod_path / "upgrades"

    if not upgrades_path.exists() or not upgrades_path.is_dir():
        return False

    # Find migration files for this version
    for f in sorted(upgrades_path.glob("*.py")):
        if f.name.startswith("_"):
            continue
        try:
            spec = importlib.util.spec_from_file_location(
                f"upgrade_{module_name}_{f.stem}",
                f,
            )
            if spec is None or spec.loader is None:
                continue
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            if hasattr(mod, "migrate"):
                _logger.info("Running %s migrate for %s", f.name, module_name)
                mod.migrate(cr, version)
                return True
        except Exception as e:
            _logger.exception("Upgrade %s failed: %s", f.name, e)
            raise

    return False
