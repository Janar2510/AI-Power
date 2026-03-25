"""Phases 578–581: stock valuation depth (AVCO/lot/negative policy + registry fields)."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase
from core.tools.config import parse_config


class TestStockValuationPost208Phase578581(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase578_stock")
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_valuation_layer_has_lot_id(self):
        Layer = self.registry.get("stock.valuation.layer")
        self.assertIsNotNone(Layer)
        fields = Layer.fields_get()
        self.assertIn("lot_id", fields)

    def test_company_has_stock_valuation_allow_negative(self):
        Company = self.registry.get("res.company")
        self.assertIsNotNone(Company)
        fields = Company.fields_get()
        self.assertIn("stock_valuation_allow_negative", fields)
