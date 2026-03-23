"""Phase 536: account.tax compute_all price_include (single percent tax)."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeEnv:
    def get(self, _name):
        return None


class TestAccountTaxComputePhase536(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase536")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_price_include_percent_extracts_base(self):
        Tax = self.registry.get("account.tax")
        self.assertIsNotNone(Tax)
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
        self.assertEqual(len(out["taxes"]), 1)
        self.assertAlmostEqual(out["taxes"][0]["amount"], 15.0, places=5)

    def test_excluded_percent_unchanged(self):
        Tax = self.registry.get("account.tax")
        tax = Tax(
            _FakeEnv(),
            [1],
            {
                "name": "VAT 15%",
                "amount": 15.0,
                "amount_type": "percent",
                "price_include": False,
            },
        )
        out = tax.compute_all(100.0, 1.0)
        self.assertAlmostEqual(out["total_excluded"], 100.0, places=5)
        self.assertAlmostEqual(out["total_included"], 115.0, places=5)
