"""Phase 545: discover_po_files / load_po_file used by init_data (regression)."""

import tempfile
import unittest
from pathlib import Path

from core.tools.translate import discover_po_files, load_po_file, parse_po_file


class TestTranslateDiscoverPhase545(unittest.TestCase):
    def test_discover_and_load_po(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mod = root / "fake_mod"
            i18n = mod / "i18n"
            i18n.mkdir(parents=True)
            po = i18n / "et_EE.po"
            po.write_text(
                'msgid "Hello"\nmsgstr "Tere"\n\nmsgid "World"\nmsgstr "Maailm"\n',
                encoding="utf-8",
            )
            found = list(discover_po_files(root))
            self.assertEqual(len(found), 1)
            module, lang, path = found[0]
            self.assertEqual(module, "fake_mod")
            self.assertEqual(lang, "et_EE")
            self.assertEqual(path, po)
            rows = list(load_po_file(path, module, lang))
            self.assertIn(("fake_mod", "et_EE", "Hello", "Tere"), rows)
            self.assertIn(("fake_mod", "et_EE", "World", "Maailm"), rows)

    def test_parse_po_empty_file(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".po", delete=False, encoding="utf-8") as f:
            f.write("")
            p = Path(f.name)
        try:
            self.assertEqual(parse_po_file(p), {})
        finally:
            p.unlink(missing_ok=True)
