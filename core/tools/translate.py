"""Translation utilities - server-side _() and .po loading (Phase 94)."""

import re
from pathlib import Path
from typing import Any, Dict, Optional

# Thread-local language for _() lookups
import threading

_tls = threading.local()


def _get_lang() -> str:
    """Get current thread-local language code."""
    return getattr(_tls, "lang", "en_US")


def _set_lang(lang: str) -> None:
    """Set thread-local language for _() lookups."""
    _tls.lang = lang or "en_US"


def _(source: str, lang: Optional[str] = None) -> str:
    """
    Translate source string. Uses thread-local lang or passed lang.
    Returns source if no translation found.
    """
    if not source or not isinstance(source, str):
        return source
    l = lang or _get_lang()
    catalog = _get_catalog()
    key = (l, source)
    return catalog.get(key, source)


def _get_catalog() -> Dict[tuple, str]:
    """Get thread-local translation catalog."""
    if not hasattr(_tls, "catalog"):
        _tls.catalog = {}
    return _tls.catalog


def load_translations_from_db(env: Any) -> None:
    """Load ir.translation records into thread-local catalog for current lang."""
    lang = _get_lang()
    Translation = env.get("ir.translation")
    if not Translation:
        return
    try:
        rows = Translation.search_read([["lang", "=", lang]], ["src", "value"])
        catalog = _get_catalog()
        for r in rows:
            src = (r.get("src") or "").strip()
            val = (r.get("value") or "").strip()
            if src and val:
                catalog[(lang, src)] = val
    except Exception:
        pass


def _unquote(s: str) -> str:
    """Unescape quoted string from .po file."""
    return s.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')


def load_po_file(path: Path, module: str, lang: str) -> list:
    """
    Parse .po file and return list of (module, lang, src, value) tuples.
    Handles msgid "..." and msgstr "..." on separate lines.
    """
    result = []
    if not path.exists():
        return result
    content = path.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('msgid "'):
            src = _unquote(line[7:-1])
            i += 1
            val = ""
            if i < len(lines) and lines[i].strip().startswith('msgstr "'):
                val = _unquote(lines[i].strip()[8:-1])
                i += 1
            if src:  # Skip header (empty msgid)
                result.append((module, lang, src, val))
        else:
            i += 1
    return result


def discover_po_files(addons_path: Path) -> list:
    """Find all .po files in addons/<module>/i18n/<lang>.po."""
    found = []
    addons_dir = addons_path if addons_path.name == "addons" else addons_path / "addons"
    if not addons_dir.exists():
        return found
    for mod_dir in addons_dir.iterdir():
        if not mod_dir.is_dir():
            continue
        i18n_dir = mod_dir / "i18n"
        if not i18n_dir.exists():
            continue
        for po_file in i18n_dir.glob("*.po"):
            lang = po_file.stem
            found.append((mod_dir.name, lang, po_file))
    return found
