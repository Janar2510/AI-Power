"""Phase 665: merged sale.order exposes confirm hooks for pricelist, stock, and account layers."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class TestSaleConfirmSideEffectsPhase665(unittest.TestCase):
    """Registry merge must expose _action_confirm_* helpers used by the stacked confirm pipeline."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase665")
        from core.orm.models import ModelBase

        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_sale_order_exposes_stacked_confirm_hooks(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertIsNotNone(sale_order_model)
        self.assertTrue(callable(getattr(sale_order_model, "_action_confirm_sale_core", None)))
        self.assertTrue(callable(getattr(sale_order_model, "_action_confirm_stock_core", None)))
        self.assertTrue(callable(getattr(sale_order_model, "_action_confirm_account_core", None)))

    def test_action_confirm_method_exists(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertTrue(callable(getattr(sale_order_model, "action_confirm", None)))


if __name__ == "__main__":
    unittest.main()
