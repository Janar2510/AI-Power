"""Module tracking for upgrades (Phase 102)."""

from typing import Dict, Iterable

from core.modules import get_manifest, get_modules_with_version
from core.tools import config
from core.orm import Model, fields


class IrModuleModule(Model):
    _name = "ir.module.module"
    _description = "Installed Module"

    name = fields.Char(required=True)
    state = fields.Selection(
        selection=[
            ("uninstalled", "Uninstalled"),
            ("installed", "Installed"),
            ("to upgrade", "To Upgrade"),
        ],
        default="installed",
    )
    installed_version = fields.Char(string="Installed Version")
    latest_version = fields.Char(string="Latest Version")

    @classmethod
    def sync_discovered_modules(cls) -> None:
        """Track all discovered modules per DB; server-wide start installed."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return
        server_wide = set(config.get_config().get("server_wide_modules", []))
        for name, version in get_modules_with_version():
            existing = cls.search([("name", "=", name)])
            vals = {
                "name": name,
                "latest_version": version,
            }
            if name in server_wide:
                vals.update({
                    "state": "installed",
                    "installed_version": version,
                })
            elif not existing or not existing.ids:
                vals.update({
                    "state": "uninstalled",
                    "installed_version": None,
                })
            if existing and existing.ids:
                cls.browse(existing.ids[0]).write(vals)
            else:
                cls.create(vals)

    @classmethod
    def mark_modules_installed(cls, module_names: Iterable[str]) -> None:
        """Mark requested modules installed with current manifest version."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return
        requested = list(module_names or [])
        if not requested:
            return
        cls.sync_discovered_modules()
        for name in requested:
            try:
                version = get_manifest(name).get("version", "1.0")
            except Exception:
                version = "1.0"
            rows = cls.search([("name", "=", name)])
            vals: Dict[str, object] = {
                "name": name,
                "state": "installed",
                "installed_version": version,
                "latest_version": version,
            }
            if rows and rows.ids:
                cls.browse(rows.ids[0]).write(vals)
            else:
                cls.create(vals)
