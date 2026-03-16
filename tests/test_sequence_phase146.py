"""Phase 146: Document sequence integration (sale.order, purchase.order, account.move)."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestSequencePhase146(unittest.TestCase):
    """Test auto-generated document numbers via ir.sequence."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def _get_env(self):
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
            return env

    def test_sale_order_sequence(self):
        """Create sale orders; names should be SO/00001, SO/00002, ..."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Partner = env.get("res.partner")
        SaleOrder = env.get("sale.order")
        if not Partner or not SaleOrder:
            self.skipTest("sale module not loaded")
        partners = Partner.search([], limit=1)
        if not partners.ids:
            self.skipTest("No res.partner")
        o1 = SaleOrder.create({"partner_id": partners.ids[0]})
        o2 = SaleOrder.create({"partner_id": partners.ids[0]})
        self.assertIsNotNone(o1)
        self.assertIsNotNone(o2)
        n1 = o1.read(["name"])[0].get("name", "")
        n2 = o2.read(["name"])[0].get("name", "")
        self.assertTrue(n1.startswith("SO/"), f"Expected SO/ prefix, got {n1}")
        self.assertTrue(n2.startswith("SO/"), f"Expected SO/ prefix, got {n2}")
        self.assertNotEqual(n1, n2)

    def test_purchase_order_sequence(self):
        """Create purchase orders; names should be PO/00001, PO/00002, ..."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Partner = env.get("res.partner")
        PurchaseOrder = env.get("purchase.order")
        if not Partner or not PurchaseOrder:
            self.skipTest("purchase module not loaded")
        partners = Partner.search([], limit=1)
        if not partners.ids:
            self.skipTest("No res.partner")
        o1 = PurchaseOrder.create({"partner_id": partners.ids[0]})
        o2 = PurchaseOrder.create({"partner_id": partners.ids[0]})
        self.assertIsNotNone(o1)
        self.assertIsNotNone(o2)
        n1 = o1.read(["name"])[0].get("name", "")
        n2 = o2.read(["name"])[0].get("name", "")
        self.assertTrue(n1.startswith("PO/"), f"Expected PO/ prefix, got {n1}")
        self.assertTrue(n2.startswith("PO/"), f"Expected PO/ prefix, got {n2}")
        self.assertNotEqual(n1, n2)

    def test_account_move_sequence(self):
        """Create account moves; names should be INV/00001, INV/00002, ..."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Journal = env.get("account.journal")
        AccountMove = env.get("account.move")
        if not Journal or not AccountMove:
            self.skipTest("account module not loaded")
        journals = Journal.search([], limit=1)
        if not journals.ids:
            Journal.create({"name": "Sales", "code": "SALE", "type": "sale"})
            journals = Journal.search([], limit=1)
        if not journals.ids:
            self.skipTest("No account.journal")
        m1 = AccountMove.create({"journal_id": journals.ids[0]})
        m2 = AccountMove.create({"journal_id": journals.ids[0]})
        self.assertIsNotNone(m1)
        self.assertIsNotNone(m2)
        n1 = m1.read(["name"])[0].get("name", "")
        n2 = m2.read(["name"])[0].get("name", "")
        self.assertTrue(n1.startswith("INV/"), f"Expected INV/ prefix, got {n1}")
        self.assertTrue(n2.startswith("INV/"), f"Expected INV/ prefix, got {n2}")
        self.assertNotEqual(n1, n2)
