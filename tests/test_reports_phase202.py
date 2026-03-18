"""Phase 202: Inventory & Sales Reports."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestReportsPhase202(unittest.TestCase):
    """Test stock valuation and sales revenue reports."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_get_stock_valuation_report(self):
        """product.product.get_stock_valuation_report returns list of dicts."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Product = env.get("product.product")
            if not Product:
                self.skipTest("product.product not loaded")
            rows = Product.get_stock_valuation_report()
            self.assertIsInstance(rows, list)
            for r in rows:
                self.assertIn("product", r)
                self.assertIn("qty_available", r)
                self.assertIn("standard_price", r)
                self.assertIn("total_value", r)

    def test_get_sales_revenue_report(self):
        """sale.order.get_sales_revenue_report returns list of dicts."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            SaleOrder = env.get("sale.order")
            if not SaleOrder:
                self.skipTest("sale.order not loaded")
            rows = SaleOrder.get_sales_revenue_report("2020-01-01", "2030-12-31", group_by="month")
            self.assertIsInstance(rows, list)
            for r in rows:
                self.assertIn("period", r)
                self.assertIn("revenue", r)
