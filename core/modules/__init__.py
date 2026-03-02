"""Module loader and registry."""

from .assets import get_bundle_content, get_bundle_urls, resolve_bundle_assets
from .module import (
    get_manifest,
    get_module_path,
    get_modules,
    get_modules_with_version,
    get_resource_path,
    resolve_load_order,
)
from .loader import load_module_graph, load_openerp_module
from .registry import ModuleRegistry

__all__ = [
    "get_bundle_content",
    "get_bundle_urls",
    "resolve_bundle_assets",
    "get_manifest",
    "get_module_path",
    "get_modules",
    "get_modules_with_version",
    "get_resource_path",
    "load_module_graph",
    "load_openerp_module",
    "ModuleRegistry",
    "resolve_load_order",
]
