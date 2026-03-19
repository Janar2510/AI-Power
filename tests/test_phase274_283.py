"""Phase 274-283: accounting, crm, gamification, supply chain and bridge addons."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import parse_config


class TestPhase274283(unittest.TestCase):
    """Parity checks for phases 274-283."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase274_283"
        cls.registry = Registry(cls.db)
        from core.orm.models import ModelBase

        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()
        try:
            with get_cursor(cls.db) as cr:
                init_schema(cr, cls.registry)
                cr.commit()
        except Exception:
            pass

    def test_phase274_account_debit_note(self):
        self.assertIsNotNone(self.registry.get("account.debit.note"))
        AccountMove = self.registry.get("account.move")
        self.assertIsNotNone(AccountMove)
        self.assertTrue(hasattr(AccountMove, "debit_origin_id"))

    def test_phase275_crm_sms(self):
        Lead = self.registry.get("crm.lead")
        self.assertIsNotNone(Lead)
        self.assertTrue(hasattr(Lead, "sms_ids"))
        self.assertTrue(hasattr(Lead, "sms_count"))

    def test_phase276_gamification_models(self):
        for model in (
            "gamification.badge",
            "gamification.badge.user",
            "gamification.challenge",
            "gamification.challenge.line",
            "gamification.goal",
            "gamification.goal.definition",
            "gamification.karma.rank",
            "gamification.karma.tracking",
        ):
            self.assertIsNotNone(self.registry.get(model), f"{model} should be registered")
        Users = self.registry.get("res.users")
        self.assertTrue(hasattr(Users, "karma"))
        self.assertTrue(hasattr(Users, "rank_id"))

    def test_phase277_sale_loyalty(self):
        self.assertIsNotNone(self.registry.get("sale.order.coupon.points"))
        SaleOrder = self.registry.get("sale.order")
        self.assertTrue(hasattr(SaleOrder, "applied_coupon_ids"))
        self.assertTrue(hasattr(SaleOrder, "code_enabled_rule_ids"))
        self.assertTrue(hasattr(SaleOrder, "coupon_point_ids"))
        self.assertTrue(hasattr(SaleOrder, "reward_amount"))
        self.assertTrue(hasattr(SaleOrder, "gift_card_count"))

    def test_phase278_gamification_sale_crm(self):
        Lead = self.registry.get("crm.lead")
        self.assertTrue(hasattr(Lead, "_gamification_signal"))

    def test_phase279_purchase_requisition(self):
        self.assertIsNotNone(self.registry.get("purchase.requisition"))
        self.assertIsNotNone(self.registry.get("purchase.requisition.line"))
        PurchaseOrder = self.registry.get("purchase.order")
        self.assertTrue(hasattr(PurchaseOrder, "requisition_id"))

    def test_phase280_stock_landed_costs(self):
        self.assertIsNotNone(self.registry.get("stock.landed.cost"))
        self.assertIsNotNone(self.registry.get("stock.landed.cost.line"))

    def test_phase281_sale_mrp(self):
        SaleOrder = self.registry.get("sale.order")
        SaleLine = self.registry.get("sale.order.line")
        self.assertTrue(hasattr(SaleOrder, "production_count"))
        self.assertTrue(hasattr(SaleLine, "mrp_production_ids"))
        self.assertTrue(hasattr(SaleLine, "production_count"))

    def test_phase282_purchase_mrp(self):
        Bom = self.registry.get("mrp.bom")
        PoLine = self.registry.get("purchase.order.line")
        self.assertTrue(hasattr(Bom, "purchase_order_line_ids"))
        self.assertTrue(hasattr(PoLine, "bom_line_id"))

    def test_phase283_composite_bridges(self):
        SaleLine = self.registry.get("sale.order.line")
        AnalyticLine = self.registry.get("analytic.line")
        self.assertTrue(hasattr(SaleLine, "purchase_stock_move_count"))
        self.assertTrue(hasattr(SaleLine, "_update_purchase_price_from_stock_move"))
        self.assertTrue(hasattr(AnalyticLine, "margin"))
