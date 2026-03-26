"""Phase 473: received-qty lookup uses purchase_id OR origin (PO reference)."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakePickingModel:
    last_domain = None

    @classmethod
    def search(cls, domain):
        cls.last_domain = list(domain)
        return _FakePickingRecordset([])


class _FakePickingRecordset:
    def __init__(self, items):
        self._items = items

    def __iter__(self):
        return iter(self._items)


class _FakeMoveModel:
    def search(self, domain):
        return _FakeMoveResult([])


class _FakeMoveResult:
    def __init__(self, ids):
        self.ids = list(ids)


class _FakeEnv:
    def __init__(self):
        self.models = {
            "stock.picking": _FakePickingModel,
            "stock.move": _FakeMoveModel(),
        }

    def get(self, name):
        return self.models.get(name)


class _FakePORecordset:
    def __init__(self, env, oid, name):
        self.env = env
        self.ids = [oid]
        self._name = name

    def read(self, fields):
        row = {"id": self.ids[0]}
        if "name" in fields:
            row["name"] = self._name
        return [row]


class _FakePickingForCount:
    last_domain = None

    @classmethod
    def search_count(cls, domain, env=None, operation="read"):
        cls.last_domain = list(domain) if domain is not None else []
        return 0


class _FakeRec:
    def __init__(self, env, oid, name):
        self.env = env
        self.ids = [oid]
        self.name = name

    def read(self, fields):
        row = {"id": self.ids[0]}
        if "name" in fields:
            row["name"] = self.name
        return [row]


class _FakeRecs:
    def __init__(self, env, items):
        self.env = env
        self._items = items

    def __iter__(self):
        return iter(self._items)


class TestPurchaseReceiptDomainPhase473(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase473")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def setUp(self):
        _FakePickingModel.last_domain = None

    def test_get_received_qty_searches_pickings_by_purchase_id_or_origin(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model)
        env = _FakeEnv()
        rs = _FakePORecordset(env, 99, "PO/REL-473")
        po_model._get_received_qty_by_product(rs)
        dom = _FakePickingModel.last_domain
        self.assertIsNotNone(dom)
        self.assertEqual(dom[0], "|")
        self.assertIn(("purchase_id", "=", 99), dom)
        self.assertIn(("origin", "=", "PO/REL-473"), dom)


class TestPurchaseStockReceiptCountDomain(unittest.TestCase):
    """purchase_stock.receipt_count uses the same OR domain as received-qty (Phase 474)."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase473b")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def setUp(self):
        _FakePickingForCount.last_domain = None

    def test_receipt_count_search_uses_purchase_id_or_origin(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model)
        self.assertTrue(
            hasattr(po_model, "_compute_receipt_count"),
            "purchase_stock should add _compute_receipt_count",
        )
        env = _FakeEnvForCount()
        recs = _FakeRecs(env, [_FakeRec(env, 12, "PO/CNT-474")])
        po_model._compute_receipt_count(recs)
        dom = _FakePickingForCount.last_domain
        self.assertEqual(dom[0], "|")
        self.assertIn(("purchase_id", "=", 12), dom)
        self.assertIn(("origin", "=", "PO/CNT-474"), dom)


class _FakeEnvForCount:
    def __init__(self):
        self.models = {"stock.picking": _FakePickingForCount}

    def get(self, name):
        return self.models.get(name)
