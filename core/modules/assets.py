"""Asset bundle resolution from module manifests.

Parses manifest 'assets' key, resolves include/remove/after directives,
and returns ordered file paths for CSS and JS bundles.

**Concat vs ESM (Phase 527):** Production `web.assets_web` JS is built by concatenating
classic scripts. Run `npm run check:assets-concat` (or `python3 scripts/check_concat_bundle.py`)
before shipping UI changes; optional `npm run build:web` produces an IIFE bundle under
`addons/web/static/dist/` for alternate delivery (see docs/frontend.md).
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from core.tools import config

from .module import get_manifest, get_module_path, resolve_load_order

_logger = logging.getLogger("erp.modules.assets")

# Directives (Odoo parity)
APPEND = "append"
PREPEND = "prepend"
REMOVE = "remove"
INCLUDE = "include"
AFTER = "after"
BEFORE = "before"
REPLACE = "replace"

DIRECTIVES_WITH_TARGET = (AFTER, BEFORE, REPLACE)

# Extensions we treat as CSS or JS
CSS_EXTENSIONS = {".css", ".scss"}
JS_EXTENSIONS = {".js", ".ts", ".mjs"}


def _process_command(command: Any) -> Tuple[str, Optional[str], Any]:
    """Parse manifest command to (directive, target, path_def)."""
    if isinstance(command, str):
        return APPEND, None, command
    if isinstance(command, (list, tuple)) and len(command) >= 2:
        if command[0] in DIRECTIVES_WITH_TARGET and len(command) >= 3:
            return command[0], command[1], command[2]
        return command[0], None, command[1]
    return APPEND, None, str(command)


def _resolve_path(path_def: str, module_name: str) -> Optional[Path]:
    """Resolve asset path to filesystem path. Supports module/path format."""
    path_def = path_def.strip()
    if not path_def or path_def.startswith("http://") or path_def.startswith("https://"):
        return None

    # Normalize: remove leading slash, handle module/path
    if path_def.startswith("/"):
        path_def = path_def[1:]

    # Format: "module/path" or "module/static/src/file.js"
    parts = path_def.split("/", 1)
    if len(parts) < 2:
        return None

    mod, subpath = parts[0], parts[1]
    base = get_module_path(mod)
    if base is None:
        return None

    resolved = (base / subpath).resolve()
    if not resolved.is_relative_to(base):
        return None
    if not resolved.exists():
        return None
    return resolved


def _resolve_asset_path(path_def: str, module_name: str) -> List[Tuple[str, Path]]:
    """Resolve path to list of (web_path, fs_path). Supports simple globs for MVP."""
    if "*" not in path_def and "?" not in path_def:
        p = _resolve_path(path_def, module_name)
        if p and p.is_file():
            return [(path_def, p)]
        return []

    # Simple glob: module/static/src/**/* or module/static/src/*
    parts = path_def.split("/", 1)
    if len(parts) < 2:
        return []
    mod, subpath = parts[0], parts[1]
    base = get_module_path(mod)
    if base is None:
        return []

    result: List[Tuple[str, Path]] = []
    prefix = subpath.split("*")[0].rstrip("/")
    search_dir = base / prefix if prefix else base
    if not search_dir.exists():
        return []

    for f in search_dir.rglob("*"):
        if f.is_file():
            ext = f.suffix.lower()
            if ext in CSS_EXTENSIONS or ext in JS_EXTENSIONS:
                rel = str(f.relative_to(base)).replace("\\", "/")
                web_path = f"{mod}/{rel}"
                result.append((web_path, f))
    return sorted(result, key=lambda x: x[0])


def _get_asset_type(path: Path) -> Optional[str]:
    """Return 'css' or 'js' based on extension."""
    ext = path.suffix.lower()
    if ext in CSS_EXTENSIONS:
        return "css"
    if ext in JS_EXTENSIONS:
        return "js"
    return None


def resolve_bundle_assets(
    bundle_name: str,
    loaded_modules: Optional[List[str]] = None,
) -> Dict[str, List[Tuple[str, Path]]]:
    """
    Resolve all asset paths for a bundle.
    Returns {"css": [(web_path, fs_path), ...], "js": [...]}.
    """
    if loaded_modules is None:
        cfg = config.get_config()
        loaded_modules = cfg.get("server_wide_modules", ["base", "web"])
        loaded_modules = [m for m in loaded_modules if get_module_path(m) is not None]

    order = resolve_load_order(loaded_modules)
    css_list: List[Tuple[str, Path]] = []
    js_list: List[Tuple[str, Path]] = []
    css_seen: set = set()
    js_seen: set = set()

    def _apply_directive(directive: str, target: Optional[str], path_def: Any, module: str) -> None:
        nonlocal css_list, js_list, css_seen, js_seen

        if directive == INCLUDE:
            # Recursively include another bundle
            _fill_bundle(path_def, seen_bundles)
            return

        # Resolve path(s)
        items = _resolve_asset_path(str(path_def), module)

        for web_path, fs_path in items:
            asset_type = _get_asset_type(fs_path)
            if asset_type == "css":
                lst, seen = css_list, css_seen
            elif asset_type == "js":
                lst, seen = js_list, js_seen
            else:
                continue

            if directive == APPEND:
                if web_path not in seen:
                    lst.append((web_path, fs_path))
                    seen.add(web_path)
            elif directive == PREPEND:
                if web_path not in seen:
                    lst.insert(0, (web_path, fs_path))
                    seen.add(web_path)
            elif directive == REMOVE:
                lst[:] = [(w, f) for w, f in lst if w != web_path]
                seen.discard(web_path)
            elif directive == AFTER and target:
                idx = next((i for i, (w, _) in enumerate(lst) if w == target), -1)
                if idx >= 0 and web_path not in seen:
                    lst.insert(idx + 1, (web_path, fs_path))
                    seen.add(web_path)
            elif directive == BEFORE and target:
                idx = next((i for i, (w, _) in enumerate(lst) if w == target), -1)
                if idx >= 0 and web_path not in seen:
                    lst.insert(max(0, idx), (web_path, fs_path))
                    seen.add(web_path)
            elif directive == REPLACE and target:
                lst[:] = [(web_path, fs_path) if w == target else (w, f) for w, f in lst]
                if web_path not in seen:
                    seen.add(web_path)
                    seen.discard(target)

    seen_bundles: set = set()

    def _fill_bundle(bundle: str, seen: set) -> None:
        if bundle in seen:
            return
        seen.add(bundle)

        for module in order:
            try:
                manifest = get_manifest(module)
            except Exception:
                continue

            assets = manifest.get("assets") or {}
            commands = assets.get(bundle, [])
            if not commands:
                continue

            for cmd in commands:
                directive, target, path_def = _process_command(cmd)
                _apply_directive(directive, target, path_def, module)

    _fill_bundle(bundle_name, seen_bundles)

    return {"css": css_list, "js": js_list}


def get_bundle_content(
    bundle_name: str,
    asset_type: str,
    loaded_modules: Optional[List[str]] = None,
) -> Tuple[bytes, str]:
    """
    Get concatenated bundle content.
    Returns (content_bytes, mimetype).
    """
    resolved = resolve_bundle_assets(bundle_name, loaded_modules)
    items = resolved.get(asset_type, [])

    parts: List[bytes] = []
    for web_path, fs_path in items:
        try:
            content = fs_path.read_bytes()
            if asset_type == "css":
                # Optional: add source comment for debug
                parts.append(f"\n/* {web_path} */\n".encode())
            parts.append(content)
        except OSError as e:
            _logger.warning("Could not read asset %s: %s", fs_path, e)

    mimetype = "text/css" if asset_type == "css" else "application/javascript"
    return b"\n".join(parts), mimetype


def get_bundle_urls(
    bundle_name: str,
    loaded_modules: Optional[List[str]] = None,
) -> Dict[str, List[str]]:
    """
    Get list of individual asset URLs for debug mode.
    Returns {"css": ["/web/static/..."], "js": [...]}.
    """
    resolved = resolve_bundle_assets(bundle_name, loaded_modules)
    result: Dict[str, List[str]] = {"css": [], "js": []}

    for asset_type in ("css", "js"):
        for web_path, _ in resolved.get(asset_type, []):
            # web_path is "module/path" -> /module/path for static serving
            url = f"/{web_path}" if not web_path.startswith("/") else web_path
            result[asset_type].append(url)

    return result
