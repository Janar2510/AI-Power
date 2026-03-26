"""Phase 465 / 654: merged sale confirmation should compose sale + stock + account hooks."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeSaleOrder:
    def __init__(self):
        self.calls = []


class _FakeSaleOrderLineModel:
    _registry = None

    @classmethod
    def search(cls, domain):
        class _Result:
            ids = [1]
        return _Result()


class _FakeEnv:
    def __init__(self, line_calls):
        self.line_calls = line_calls

    def get(self, model_name):
        if model_name == "sale.order.line":
            calls = self.line_calls

            class _BoundLineModel(_FakeSaleOrderLineModel):
                @classmethod
                def _purchase_service_generation(cls, recordset):
                    calls.append("_purchase_service_generation")

            return _BoundLineModel
        return None


class TestSaleConfirmPhase465(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase465")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_action_confirm_composes_helper_chain_without_super(self):
        sale_order_model = self.registry.get("sale.order")
        self.assertIsNotNone(sale_order_model, "sale.order should load into the registry")

        line_calls = []
        order = sale_order_model(_FakeEnv(line_calls), [1])
        order.calls = []
        order._action_confirm_sale_core = lambda: order.calls.append("_action_confirm_sale_core")
        order._action_confirm_stock_core = lambda: order.calls.append("_action_confirm_stock_core")
        order._action_confirm_account_core = lambda: order.calls.append("_action_confirm_account_core")

        sale_order_model.action_confirm(order)

        self.assertEqual(
            order.calls,
            [
                "_action_confirm_sale_core",
                "_action_confirm_stock_core",
                "_action_confirm_account_core",
            ],
        )
        self.assertEqual(line_calls, ["_purchase_service_generation"])

