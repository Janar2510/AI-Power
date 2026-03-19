"""Phase 262: utm, phone_validation, iap_mail modules."""

import os
import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.db import init_schema
from core.sql_db import get_cursor
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry


class TestPhase262(unittest.TestCase):
    """Phase 262: Foundation Infrastructure."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase262"
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

    def test_utm_models_exist(self):
        """utm.campaign, utm.medium, utm.source, utm.stage, utm.tag, utm.mixin exist."""
        registry = self.registry
        for name in ("utm.campaign", "utm.medium", "utm.source", "utm.stage", "utm.tag", "utm.mixin"):
            self.assertIsNotNone(registry.get(name), f"{name} should be registered")

    def test_utm_mixin_abstract(self):
        """utm.mixin is abstract (no table)."""
        UTM = self.registry.get("utm.mixin")
        self.assertIsNotNone(UTM)
        self.assertIsNone(UTM._table)

    def test_phone_blacklist_exists(self):
        """phone.blacklist model exists."""
        self.assertIsNotNone(self.registry.get("phone.blacklist"))

    def test_phone_validation_res_partner_extends(self):
        """res.partner has _phone_format from phone_validation."""
        Partner = self.registry.get("res.partner")
        self.assertIsNotNone(Partner)
        self.assertTrue(hasattr(Partner, "_phone_format"))

    def test_iap_mail_extends_iap_account(self):
        """iap.account has company_ids, warning_threshold from iap_mail."""
        Iap = self.registry.get("iap.account")
        self.assertIsNotNone(Iap)
        self.assertTrue(hasattr(Iap, "company_ids"))
        self.assertTrue(hasattr(Iap, "warning_threshold"))
