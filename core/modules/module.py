"""Module manifest parsing and discovery."""

import ast
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from core.tools import config

MODULE_NAME_RE = re.compile(r"^\w{1,256}$")
MANIFEST_NAMES = ["__manifest__.py"]

_DEFAULT_MANIFEST = {
    "application": False,
    "assets": {},
    "auto_install": False,
    "category": "Uncategorized",
    "data": [],
    "demo": [],
    "depends": [],
    "description": "",
    "installable": True,
    "license": "LGPL-3",
    "version": "1.0",
}


def get_manifest(module_name: str, path: Optional[Path] = None) -> Dict[str, Any]:
    """Parse __manifest__.py and return manifest dict."""
    if path is None:
        path = get_module_path(module_name)
    if path is None:
        raise FileNotFoundError(f"Module {module_name} not found")

    manifest_file = path / "__manifest__.py"
    if not manifest_file.exists():
        raise FileNotFoundError(f"No manifest in {module_name}")

    content = manifest_file.read_text(encoding="utf-8")
    try:
        # Odoo-style: file contains a single dict literal
        result = ast.literal_eval(content.strip())
        if isinstance(result, dict):
            return result
    except (SyntaxError, ValueError):
        pass

    try:
        tree = ast.parse(content)
        if tree.body:
            expr = tree.body[0]
            if isinstance(expr, ast.Expr) and isinstance(expr.value, ast.Dict):
                return ast.literal_eval(expr.value)
    except (SyntaxError, ValueError) as e:
        raise ValueError(f"Invalid manifest in {module_name}: {e}") from e

    raise ValueError(f"No manifest dict found in {module_name}")


def get_module_path(module_name: str) -> Optional[Path]:
    """Return path to module directory, or None if not found."""
    for addons_dir in config.get_addons_paths():
        if not addons_dir.exists():
            continue
        module_path = addons_dir / module_name
        if module_path.is_dir() and (module_path / "__manifest__.py").exists():
            return module_path.resolve()
    return None


def get_resource_path(module_name: str, path: str) -> Optional[Path]:
    """Return path to a resource file within a module."""
    base = get_module_path(module_name)
    if base is None:
        return None
    resolved = (base / path).resolve()
    if not resolved.is_relative_to(base):
        return None
    return resolved if resolved.exists() else None


def get_modules() -> List[str]:
    """Return list of discovered module names."""
    seen: set = set()
    result: List[str] = []

    for addons_dir in config.get_addons_paths():
        if not addons_dir.exists():
            continue
        for entry in addons_dir.iterdir():
            if entry.is_dir() and not entry.name.startswith("."):
                manifest = entry / "__manifest__.py"
                if manifest.exists() and entry.name not in seen:
                    seen.add(entry.name)
                    result.append(entry.name)

    return sorted(result)


def get_modules_with_version() -> List[Tuple[str, str]]:
    """Return list of (module_name, version) tuples."""
    result = []
    for name in get_modules():
        try:
            manifest = get_manifest(name)
            result.append((name, manifest.get("version", "1.0")))
        except Exception:
            pass
    return result


def get_module_dependencies(module_name: str) -> List[str]:
    """Return list of module dependencies."""
    manifest = get_manifest(module_name)
    return manifest.get("depends", [])


def resolve_load_order(module_names: List[str]) -> List[str]:
    """Resolve dependencies and return load order (topological sort)."""
    if not module_names:
        return []

    all_deps: Dict[str, List[str]] = {}
    for name in module_names:
        try:
            all_deps[name] = get_module_dependencies(name)
        except Exception:
            all_deps[name] = []

    result: List[str] = []
    visited: set = set()

    def visit(node: str) -> None:
        if node in visited:
            return
        visited.add(node)
        for dep in all_deps.get(node, []):
            if dep in module_names:
                visit(dep)
        result.append(node)

    for name in module_names:
        visit(name)

    return result
