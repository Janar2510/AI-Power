"""Phase 164: Inline One2many editing."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.rpc import _call_kw


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestOne2manyEditPhase164(unittest.TestCase):
    """Phase 164: editable One2many (order lines, BOM lines)."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_sale_order_write_order_line(self):
        """Writing purchase.order with order_line list creates/updates lines (same One2many pattern as sale)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        # Create PO with order_line
        result = _call_kw(1, self.db, "purchase.order", "create", [{
            "partner_id": 1,
            "order_line": [
                {"product_qty": 2, "price_unit": 10.0},
                {"product_qty": 1, "price_unit": 25.5},
            ],
        }], {})
        po_id = result.id if hasattr(result, "id") else (result.ids[0] if (hasattr(result, "ids") and result.ids) else result)
        self.assertIsNotNone(po_id)
        recs = _call_kw(1, self.db, "purchase.order", "read", [[po_id], ["order_line", "amount_total"]], {})
        self.assertTrue(recs and len(recs) > 0)
        lines = recs[0].get("order_line") or []
        self.assertGreaterEqual(len(lines), 2)
        amt = recs[0].get("amount_total")
        self.assertIsNotNone(amt)
        self.assertGreater(float(amt or 0), 0)

    def test_mrp_bom_write_bom_line_ids(self):
        """Writing mrp.bom with bom_line_ids creates lines."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        products = _call_kw(1, self.db, "product.product", "search_read", [[]], {"fields": ["id"], "limit": 2})
        if len(products) < 2:
            self.skipTest("Need at least 2 products for BOM test")
        p1, p2 = products[0]["id"], products[1]["id"]
        result = _call_kw(1, self.db, "mrp.bom", "create", [{
            "name": "Test BOM",
            "product_id": p1,
            "bom_line_ids": [
                {"product_id": p2, "product_qty": 3.0},
            ],
        }], {})
        bom_id = result.id if hasattr(result, "id") else (result.ids[0] if (hasattr(result, "ids") and result.ids) else result)
        self.assertIsNotNone(bom_id)
        recs = _call_kw(1, self.db, "mrp.bom", "read", [[bom_id], ["bom_line_ids"]], {})
        self.assertTrue(recs and recs[0].get("bom_line_ids"))
        self.assertEqual(len(recs[0]["bom_line_ids"]), 1)
