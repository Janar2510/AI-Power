"""Phase 478: draft-only confirm — cancelled SO/PO must not re-enter confirmed state."""

import unittest
import uuid

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    from pathlib import Path
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestConfirmDraftGuardPhase478(unittest.TestCase):
    db = "_test_rpc_read"
    _addons_path = None

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        cls._addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())
        parse_config(["--addons-path=" + cls._addons_path])
        cls._has_db = _ensure_test_db(cls.db)

    def test_po_cancelled_cannot_reconfirm(self):
        if not self._has_db:
            self.skipTest("DB not found")
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
            PurchaseOrder = env.get("purchase.order")
            Partner = env.get("res.partner")
            if not all([PurchaseOrder, Partner]):
                self.skipTest("Models not loaded")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                self.skipTest("Need partner")
            name = "PO/P478-" + str(uuid.uuid4())[:8]
            order = PurchaseOrder.create({
                "name": name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            # No order lines: avoids One2many read / _ModelProxy issues during write recompute in this DB harness.
            order.action_cancel()
            self.assertEqual(order.read(["state"])[0].get("state"), "cancel")
            order.button_confirm()
            self.assertEqual(
                order.read(["state"])[0].get("state"),
                "cancel",
                "Cancelled PO must not return to purchase on button_confirm",
            )

    def test_so_cancelled_cannot_reconfirm(self):
        if not self._has_db:
            self.skipTest("DB not found")
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
            SaleOrder = env.get("sale.order")
            Partner = env.get("res.partner")
            if not all([SaleOrder, Partner]):
                self.skipTest("Models not loaded")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                self.skipTest("Need partner")
            name = "SO/P478-" + str(uuid.uuid4())[:8]
            order = SaleOrder.create({
                "name": name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            order.action_cancel()
            self.assertEqual(order.read(["state"])[0].get("state"), "cancel")
            order.action_confirm()
            self.assertEqual(
                order.read(["state"])[0].get("state"),
                "cancel",
                "Cancelled SO must not return to sale on action_confirm",
            )
