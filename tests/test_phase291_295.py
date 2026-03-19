"""Phases 291-295: account/stock, sale bridges, purchase, product, base/auth/social."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import DEFAULT_SERVER_WIDE_MODULES, parse_config


class TestPhase291295(unittest.TestCase):
    """Parity checks for phases 291-295 (cluster E tail)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase291_295"
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

    def test_phase291_account_fleet_stock_sms_delivery(self):
        Line = self.registry.get("account.move.line")
        self.assertIsNotNone(Line)
        self.assertTrue(hasattr(Line, "vehicle_id"))

        Vehicle = self.registry.get("fleet.vehicle")
        self.assertIsNotNone(Vehicle)
        self.assertTrue(hasattr(Vehicle, "invoice_count"))

        Picking = self.registry.get("stock.picking")
        self.assertIsNotNone(Picking)
        self.assertTrue(hasattr(Picking, "sms_ids"))
        self.assertTrue(hasattr(Picking, "sms_count"))
        self.assertTrue(hasattr(Picking, "carrier_id"))
        self.assertTrue(hasattr(Picking, "carrier_tracking_ref"))
        self.assertTrue(hasattr(Picking, "weight"))

        Sms = self.registry.get("sms.sms")
        self.assertIsNotNone(Sms)
        self.assertTrue(hasattr(Sms, "picking_id"))

    def test_phase292_sale_expense_margin_loyalty_delivery(self):
        Expense = self.registry.get("hr.expense")
        self.assertIsNotNone(Expense)
        self.assertTrue(hasattr(Expense, "margin"))

        Reward = self.registry.get("loyalty.reward")
        self.assertIsNotNone(Reward)
        self.assertTrue(hasattr(Reward, "reward_type"))
        self.assertTrue(hasattr(Reward, "delivery_carrier_id"))

    def test_phase293_purchase_requisition_stock_sale(self):
        Req = self.registry.get("purchase.requisition")
        self.assertIsNotNone(Req)
        self.assertTrue(hasattr(Req, "picking_count"))
        self.assertTrue(hasattr(Req, "sale_order_count"))

        Picking = self.registry.get("stock.picking")
        self.assertIsNotNone(Picking)
        self.assertTrue(hasattr(Picking, "requisition_id"))

        Order = self.registry.get("sale.order")
        self.assertIsNotNone(Order)
        self.assertTrue(hasattr(Order, "requisition_id"))

    def test_phase294_product_margin_expiry(self):
        Product = self.registry.get("product.product")
        self.assertIsNotNone(Product)
        self.assertTrue(hasattr(Product, "total_margin"))
        self.assertTrue(hasattr(Product, "expected_margin_rate"))

        Lot = self.registry.get("stock.lot")
        self.assertIsNotNone(Lot)
        self.assertTrue(hasattr(Lot, "expiration_date"))
        self.assertTrue(hasattr(Lot, "use_date"))
        self.assertTrue(hasattr(Lot, "removal_date"))
        self.assertTrue(hasattr(Lot, "alert_date"))

    def test_phase295_auth_social_base_geo(self):
        Settings = self.registry.get("res.config.settings")
        self.assertIsNotNone(Settings)
        self.assertTrue(hasattr(Settings, "password_min_length"))
        self.assertTrue(hasattr(Settings, "password_require_upper"))
        self.assertTrue(hasattr(Settings, "password_require_digit"))
        self.assertTrue(hasattr(Settings, "password_require_special"))

        PasswordPolicy = self.registry.get("password.policy")
        self.assertIsNotNone(PasswordPolicy)

        Partner = self.registry.get("res.partner")
        self.assertIsNotNone(Partner)
        self.assertTrue(hasattr(Partner, "social_facebook"))
        self.assertTrue(hasattr(Partner, "social_twitter"))
        self.assertTrue(hasattr(Partner, "social_linkedin"))
        self.assertTrue(hasattr(Partner, "social_github"))
        self.assertTrue(hasattr(Partner, "social_instagram"))
        self.assertTrue(hasattr(Partner, "street_name"))
        self.assertTrue(hasattr(Partner, "street_number"))
        self.assertTrue(hasattr(Partner, "street_number2"))
        self.assertTrue(hasattr(Partner, "partner_latitude"))
        self.assertTrue(hasattr(Partner, "partner_longitude"))
        self.assertTrue(hasattr(Partner, "geo_localize"))

    def test_server_wide_modules_cluster_e(self):
        expected = {
            "event_crm",
            "event_sale",
            "website_crm",
            "website_payment",
            "account_fleet",
            "stock_sms",
            "stock_delivery",
            "sale_expense_margin",
            "sale_loyalty_delivery",
            "purchase_requisition_stock",
            "purchase_requisition_sale",
            "product_margin",
            "product_expiry",
            "auth_password_policy",
            "social_media",
            "base_address_extended",
            "base_geolocalize",
        }
        self.assertTrue(expected.issubset(set(DEFAULT_SERVER_WIDE_MODULES)))
