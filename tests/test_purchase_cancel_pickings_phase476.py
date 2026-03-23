"""Phase 476: cancel PO cancels open incoming pickings and their moves."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakePick:
    def __init__(self, pid):
        self.ids = [pid]
        self.writes = []

    def write(self, vals):
        self.writes.append(vals)


class _FakePickingRS:
    def __init__(self, items):
        self._items = items

    def __iter__(self):
        return iter(self._items)


class _FakeMove:
    def __init__(self):
        self.last_search_domain = None
        self.move_writes = []

    def search(self, domain, limit=None):
        self.last_search_domain = list(domain)
        m = _FakeMoveRec(200)
        return _FakeMoveRS([m], self)


class _FakeMoveRec:
    def __init__(self, mid):
        self.ids = [mid]


class _FakeMoveRS:
    def __init__(self, moves, parent):
        self._moves = moves
        self.ids = [m.ids[0] for m in moves]
        self._parent = parent

    def write(self, vals):
        self._parent.move_writes.append(vals)


class _FakePickingModel:
    last_domain = None

    def __init__(self):
        self.pick = _FakePick(55)

    def search(self, domain, limit=None):
        type(self).last_domain = list(domain)
        return _FakePickingRS([self.pick])


class _FakeOrder:
    def __init__(self):
        self.ids = [10]
        self.writes = []

    def read(self, fields):
        return [{"id": 10, "name": "PO/CAN-476"}]

    def write(self, vals):
        self.writes.append(vals)


class _FakeORS:
    def __init__(self, env):
        self.env = env
        self._order = _FakeOrder()

    def __iter__(self):
        return iter([self._order])

    def write(self, vals):
        self._order.write(vals)


class _FakePickingType476:
    def search(self, domain, limit=None):
        return _FakePTResult476([5])


class _FakePTResult476:
    def __init__(self, ids):
        self.ids = list(ids)


class _FakeEnv476:
    def __init__(self, po_model):
        self._po_model = po_model
        self.picking = _FakePickingModel()
        self.move = _FakeMove()
        self.models = {
            "purchase.order": po_model,
            "stock.picking": self.picking,
            "stock.move": self.move,
            "stock.picking.type": _FakePickingType476(),
        }

    def get(self, name):
        return self.models.get(name)


class TestPurchaseCancelPickingsPhase476(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase476")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def setUp(self):
        _FakePickingModel.last_domain = None

    def test_cancel_search_domain_links_po_and_open_states(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model)
        env = _FakeEnv476(po_model)
        rs = _FakeORS(env)
        po_model._cancel_open_incoming_pickings(rs)
        dom = _FakePickingModel.last_domain
        self.assertIsNotNone(dom)
        self.assertEqual(dom[0], "&")
        self.assertEqual(dom[2], ("state", "in", ["draft", "assigned"]))
        inner = dom[1]
        self.assertEqual(inner[0], "&")
        self.assertEqual(inner[1], ("picking_type_id", "=", 5))
        link = inner[2]
        self.assertEqual(link[0], "|")
        self.assertIn(("purchase_id", "=", 10), link)
        self.assertIn(("origin", "=", "PO/CAN-476"), link)

    def test_action_cancel_cancels_picking_moves_and_po(self):
        po_model = self.registry.get("purchase.order")
        self.assertIsNotNone(po_model)
        env = _FakeEnv476(po_model)
        rs = _FakeORS(env)
        po_model.action_cancel(rs)
        self.assertEqual(env.picking.pick.writes, [{"state": "cancel"}])
        self.assertEqual(env.move.move_writes, [{"state": "cancel"}])
        self.assertEqual(rs._order.writes, [{"state": "cancel"}])
