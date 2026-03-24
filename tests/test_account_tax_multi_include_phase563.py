"""Phase 563: account.tax compute_all — multiple percent taxes all price_include (sequential strip)."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeEnv:
    def get(self, _name):
        return None


class TestAccountTaxMultiIncludePhase563(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase563")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_two_included_taxes_chain(self):
        Tax = self.registry.get("account.tax")
        tax = Tax(_FakeEnv(), [1, 2], {})
        tax.read = lambda fields=None: [
            {"name": "T10", "amount": 10.0, "amount_type": "percent", "price_include": True},
            {"name": "T5", "amount": 5.0, "amount_type": "percent", "price_include": True},
        ]
        out = tax.compute_all(115.5, 1.0)
        self.assertAlmostEqual(out["total_included"], 115.5, places=5)
        self.assertAlmostEqual(out["total_excluded"], 100.0, places=4)
        self.assertEqual(len(out["taxes"]), 2)
        self.assertAlmostEqual(sum(t["amount"] for t in out["taxes"]), 15.5, places=4)

    def test_single_included_still_matches_phase536(self):
        Tax = self.registry.get("account.tax")
        tax = Tax(
            _FakeEnv(),
            [1],
            {
                "name": "VAT 15%",
                "amount": 15.0,
                "amount_type": "percent",
                "price_include": True,
            },
        )
        out = tax.compute_all(115.0, 1.0)
        self.assertAlmostEqual(out["total_included"], 115.0, places=5)
        self.assertAlmostEqual(out["total_excluded"], 100.0, places=5)

    def test_mixed_include_exclude_strip_then_add_phase568(self):
        Tax = self.registry.get("account.tax")
        tax = Tax(_FakeEnv(), [1, 2], {})
        tax.read = lambda fields=None: [
            {"name": "Inc", "amount": 10.0, "amount_type": "percent", "price_include": True},
            {"name": "Exc", "amount": 5.0, "amount_type": "percent", "price_include": False},
        ]
        out = tax.compute_all(110.0, 1.0)
        self.assertAlmostEqual(out["total_excluded"], 100.0, places=5)
        self.assertAlmostEqual(out["total_included"], 115.0, places=5)
        self.assertEqual(len(out["taxes"]), 2)
