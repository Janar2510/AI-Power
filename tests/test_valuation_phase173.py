"""Phase 173: Stock Valuation + Cost Tracking."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestValuationPhase173(unittest.TestCase):
    """Phase 173: stock.valuation.layer, standard_price, cost_method."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_product_has_standard_price_and_cost_method(self):
        """product.product has standard_price and cost_method fields."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        Product = registry.get("product.product")
        if not Product:
            self.skipTest("product.product not loaded")
        fields = Product.fields_get()
        self.assertIn("standard_price", fields)
        self.assertIn("cost_method", fields)

    def test_stock_valuation_layer_model_exists(self):
        """stock.valuation.layer model exists."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        Layer = registry.get("stock.valuation.layer")
        self.assertIsNotNone(Layer)
