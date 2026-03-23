#!/usr/bin/env python3
"""Fail if web.assets_web JS files use ESM `export` (concat bundle is classic script).

Run from repo root: python3 scripts/check_concat_bundle.py
See docs/frontend.md (Phase 527).
"""

from __future__ import annotations

import re
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ADDONS = ROOT / "addons"
MANIFEST = ADDONS / "web" / "__manifest__.py"

# Line starts with export (after whitespace); ignores // comments on whole line
_EXPORT_LINE = re.compile(r"^\s*export\s+(\{|\*|default|const|let|var|function|class)\b")


def _strip_line_comment(line: str) -> str:
    s = line.strip()
    if s.startswith("//"):
        return ""
    if "//" in line:
        # crude: drop // outside strings (good enough for our codebase)
        i = line.find("//")
        if i >= 0 and '"' not in line[:i] and "'" not in line[:i]:
            line = line[:i]
    return line


def _load_web_assets_js_paths() -> list[Path]:
    data = runpy.run_path(str(MANIFEST))
    assets = data.get("assets") or {}
    entries = assets.get("web.assets_web") or []
    out: list[Path] = []
    for cmd in entries:
        rel = None
        if isinstance(cmd, str):
            rel = cmd
        elif isinstance(cmd, (list, tuple)) and len(cmd) >= 2:
            rel = cmd[-1]
        if not rel or not isinstance(rel, str):
            continue
        if not rel.endswith(".js"):
            continue
        path = ADDONS / rel
        if path.is_file():
            out.append(path)
    return out


def main() -> int:
    bad: list[tuple[Path, int, str]] = []
    for path in _load_web_assets_js_paths():
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as e:
            print(f"check_concat_bundle: cannot read {path}: {e}", file=sys.stderr)
            return 2
        for lineno, line in enumerate(text.splitlines(), 1):
            check = _strip_line_comment(line)
            if _EXPORT_LINE.search(check):
                bad.append((path, lineno, line.strip()[:120]))
    if bad:
        print(
            "check_concat_bundle: ESM `export` is not allowed in web.assets_web "
            "(concatenated classic script). Use IIFE + window.* or esbuild-only modules.\n",
            file=sys.stderr,
        )
        for p, ln, snippet in bad:
            print(f"  {p.relative_to(ROOT)}:{ln}: {snippet}", file=sys.stderr)
        return 1
    print("check_concat_bundle: OK (no top-level export in web.assets_web .js files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
