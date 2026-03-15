"""Migration runner - discovers and runs migrate(cr, version) scripts (Phase 102)."""

import importlib.util
import logging
from pathlib import Path
from typing import Any, List, Optional

from core.tools import config
from core.modules.module import get_module_path, resolve_load_order

_logger = logging.getLogger("erp.upgrade")


def _discover_migrations(module_name: str) -> List[tuple]:
    """Discover migrations/<version>/pre-migrate.py and post-migrate.py in module.
    Returns [(version, 'pre'|'post', path), ...] sorted by version."""
    path = get_module_path(module_name)
    if not path:
        return []
    migrations_dir = path / "migrations"
    if not migrations_dir.exists() or not migrations_dir.is_dir():
        return []
    result = []
    for version_dir in migrations_dir.iterdir():
        if not version_dir.is_dir():
            continue
        version = version_dir.name
        for kind in ("pre-migrate", "post-migrate"):
            script = version_dir / f"{kind}.py"
            if script.exists():
                result.append((version, kind.replace("-", "_").replace("migrate", "migrate"), str(script)))
    return sorted(result, key=lambda x: (x[0], x[1]))


def _run_migrate_script(cr: Any, script_path: str, version: str, module_name: str) -> bool:
    """Execute migrate(cr, version) from script. Returns True on success."""
    try:
        spec = importlib.util.spec_from_file_location(
            f"migrate_{module_name}_{version}",
            script_path,
        )
        if not spec or not spec.loader:
            return False
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        migrate_fn = getattr(mod, "migrate", None)
        if not callable(migrate_fn):
            _logger.warning("No migrate(cr, version) in %s", script_path)
            return False
        migrate_fn(cr, version)
        _logger.info("Ran migrate %s %s", module_name, version)
        return True
    except Exception as e:
        _logger.exception("Migration failed %s %s: %s", module_name, version, e)
        raise


def run_upgrade(cr: Any, dbname: str, module_names: Optional[List[str]] = None) -> None:
    """Run migrations for modules. If module_names is None, run for all installed.
    Order: dependency order. For each module: pre-migrate, then post-migrate.
    Updates ir_module_module.installed_version after each successful migrate."""
    from core.orm import Registry, Environment
    from core.orm.models import ModelBase
    from core.modules import clear_loaded_addon_modules, load_module_graph
    from core.db import init_schema

    config.parse_config(["--addons-path=addons"])
    registry = Registry(dbname)
    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()
    init_schema(cr, registry)
    env = Environment(registry, cr=cr, uid=1)
    registry.set_env(env)
    # Phase 106: ensure default dashboard widgets on upgrade (idempotent)
    try:
        from core.db.init_data import _load_dashboard_widgets
        _load_dashboard_widgets(env)
    except Exception as e:
        _logger.warning("Could not load dashboard widgets on upgrade: %s", e)
    # Phase 110: ensure default report actions on upgrade (idempotent)
    try:
        from core.db.init_data import _load_ir_actions_reports
        _load_ir_actions_reports(env)
    except Exception as e:
        _logger.warning("Could not load ir.actions.report on upgrade: %s", e)
    to_run = module_names or []
    if not to_run:
        IrModule = registry.get("ir.module.module")
        if IrModule:
            try:
                IrModule.sync_discovered_modules()
            except Exception:
                pass
            rows = IrModule.search_read([("state", "=", "installed")], ["name"])
            to_run = [r.get("name") for r in (rows or []) if r.get("name")]
        if not to_run:
            to_run = config.get_config().get("server_wide_modules", [])
    order = resolve_load_order(to_run)
    IrModule = env.get("ir.module.module")
    if IrModule:
        IrModule.mark_modules_installed(order)
    for module_name in order:
        scripts = _discover_migrations(module_name)
        if not scripts:
            continue
        for version, kind, script_path in scripts:
            _run_migrate_script(cr, script_path, version, module_name)
            if IrModule:
                try:
                    recs = IrModule.search([("name", "=", module_name)])
                    if recs and recs.ids:
                        IrModule(env, recs.ids).write({"installed_version": version})
                except Exception:
                    pass
