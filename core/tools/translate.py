"""Translation loading (Phase 418)."""

import logging
import re
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple

_logger = logging.getLogger("erp.translate")


def parse_po_file(path: Path) -> Dict[str, str]:
    """Minimal gettext .po parser: msgid -> msgstr for simple entries."""
    out: Dict[str, str] = {}
    if not path.is_file():
        return out
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        _logger.warning("Could not read %s: %s", path, e)
        return out
    # Merge multiline msgid/msgstr blocks (simplified)
    blocks = re.split(r"\n\n+", text)
    for block in blocks:
        # Non-greedy: greedy (.*) would span msgid → last quote in block (breaks msgstr).
        mid = re.search(r'msgid\s+"(.*?)"', block, re.DOTALL)
        mstr = re.search(r'msgstr\s+"(.*?)"', block, re.DOTALL)
        if not mid or not mstr:
            continue
        key = mid.group(1).replace('\\"', '"').replace("\\n", "\n")
        val = mstr.group(1).replace('\\"', '"').replace("\\n", "\n")
        if key:
            out[key] = val or key
    return out


def discover_po_files(addons_path: Path) -> Iterator[Tuple[str, str, Path]]:
    """Yield (module_name, lang_code, po_path) for each addons/<module>/i18n/<lang>.po file."""
    root = Path(addons_path)
    if not root.is_dir():
        return
    for mod_dir in sorted(root.iterdir()):
        if not mod_dir.is_dir():
            continue
        i18n = mod_dir / "i18n"
        if not i18n.is_dir():
            continue
        for po in sorted(i18n.glob("*.po")):
            if po.is_file():
                yield mod_dir.name, po.stem, po


def load_po_file(
    po_path: Path, module: str, lang: str
) -> Iterator[Tuple[str, str, str, str]]:
    """Yield (module, lang, msgid, msgstr) tuples for ir.translation seeding (Phase 94)."""
    for src, val in parse_po_file(po_path).items():
        yield module, lang, src, val


def load_module_po_translations(env: Any, module_name: str, lang: str = "et_EE") -> int:
    """Load addons/<module>/i18n/<lang>.po into ir.translation. Returns rows inserted/updated."""
    from core.modules.module import get_module_path

    base = get_module_path(module_name)
    if not base:
        return 0
    po = base / "i18n" / f"{lang}.po"
    if not po.is_file():
        return 0
    pairs = parse_po_file(po)
    if not pairs:
        return 0
    Tr = env.get("ir.translation")
    if not Tr:
        return 0
    n = 0
    for src, val in pairs.items():
        existing = Tr.search([("lang", "=", lang), ("src", "=", src), ("module", "=", module_name)], limit=1)
        vals = {"lang": lang, "src": src, "value": val, "module": module_name, "type": "code"}
        if existing.ids:
            Tr.browse(existing.ids[0]).write(vals)
        else:
            Tr.create(vals)
        n += 1
    return n
