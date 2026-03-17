"""Phase 165: Onchange + Dynamic Domains."""

import unittest

from core.tools.config import parse_config
from core.sql_db import get_cursor, db_exists
from core.http.rpc import _call_kw


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestOnchangePhase165(unittest.TestCase):
    """Phase 165: onchange handlers for product_id, partner_id."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_sale_order_line_onchange_product_id(self):
        """sale.order.line _onchange_product_id fills price_unit and name from product."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        products = _call_kw(1, self.db, "product.product", "search_read", [[]], {"fields": ["id", "name", "list_price"], "limit": 1})
        if not products:
            self.skipTest("Need at least one product")
        pid = products[0]["id"]
        result = _call_kw(1, self.db, "sale.order.line", "onchange", ["product_id", {"product_id": pid}], {})
        self.assertIsInstance(result, dict)
        self.assertIn("price_unit", result)
        self.assertIn("name", result)
        expected = products[0].get("list_price")
        expected = float(expected) if expected is not None else 0.0
        self.assertAlmostEqual(float(result.get("price_unit") or 0), expected, places=2)
        self.assertEqual(result.get("name"), products[0].get("name", ""))

    def test_crm_lead_onchange_partner_id(self):
        """crm.lead _onchange_partner_id fills email_from, phone from partner."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        partners = _call_kw(1, self.db, "res.partner", "search_read", [[]], {"fields": ["id", "email", "phone"], "limit": 1})
        if not partners:
            self.skipTest("Need at least one partner")
        pid = partners[0]["id"]
        result = _call_kw(1, self.db, "crm.lead", "onchange", ["partner_id", {"partner_id": pid}], {})
        self.assertIsInstance(result, dict)
        self.assertIn("email_from", result)
        self.assertIn("phone", result)
        self.assertEqual(result.get("email_from"), partners[0].get("email") or "")
        self.assertEqual(result.get("phone"), partners[0].get("phone") or "")
