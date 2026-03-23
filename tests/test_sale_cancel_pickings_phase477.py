"""Phase 477: cancel SO cancels open outgoing pickings and their moves."""

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


class _FakeMove:
    def __init__(self):
        self.move_writes = []

    def search(self, domain, limit=None):
        m = _FakeMoveRec(300)
        return _FakeMoveRS([m], self)


class _FakePickingModel:
    last_domain = None

    def __init__(self):
        self.pick = _FakePick(66)

    def search(self, domain, limit=None):
        type(self).last_domain = list(domain)
        return _FakePickingRS([self.pick])


class _FakePickingType:
    def search(self, domain, limit=None):
        return _FakePTResult([8])


class _FakePTResult:
    def __init__(self, ids):
        self.ids = list(ids)


class _FakeOrder:
    def __init__(self):
        self.ids = [11]
        self.writes = []

    def read(self, fields):
        return [{"id": 11, "name": "SO/CAN-477"}]

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


class _FakeEnv477:
    def __init__(self, so_model):
        self._so_model = so_model
        self.picking = _FakePickingModel()
        self.move = _FakeMove()
        self.models = {
            "sale.order": so_model,
            "stock.picking": self.picking,
            "stock.move": self.move,
            "stock.picking.type": _FakePickingType(),
        }

    def get(self, name):
        return self.models.get(name)


class TestSaleCancelPickingsPhase477(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase477")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def setUp(self):
        _FakePickingModel.last_domain = None

    def test_cancel_domain_includes_outgoing_type_sale_link_and_open_states(self):
        so_model = self.registry.get("sale.order")
        self.assertIsNotNone(so_model)
        self.assertTrue(
            hasattr(so_model, "_cancel_open_outgoing_pickings"),
            "stock should add _cancel_open_outgoing_pickings on sale.order",
        )
        env = _FakeEnv477(so_model)
        rs = _FakeORS(env)
        so_model._cancel_open_outgoing_pickings(rs)
        dom = _FakePickingModel.last_domain
        self.assertIsNotNone(dom)
        self.assertEqual(dom[0], "&")
        self.assertEqual(dom[2], ("state", "in", ["draft", "assigned"]))
        inner = dom[1]
        self.assertEqual(inner[0], "&")
        self.assertEqual(inner[1], ("picking_type_id", "=", 8))
        link = inner[2]
        self.assertEqual(link[0], "|")
        self.assertIn(("sale_id", "=", 11), link)
        self.assertIn(("origin", "=", "SO/CAN-477"), link)

    def test_action_cancel_cancels_picking_moves_and_so(self):
        so_model = self.registry.get("sale.order")
        self.assertIsNotNone(so_model)
        env = _FakeEnv477(so_model)
        rs = _FakeORS(env)
        so_model.action_cancel(rs)
        self.assertEqual(env.picking.pick.writes, [{"state": "cancel"}])
        self.assertEqual(env.move.move_writes, [{"state": "cancel"}])
        self.assertEqual(rs._order.writes, [{"state": "cancel"}])
