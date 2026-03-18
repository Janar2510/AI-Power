"""Phase 198: Lot/Serial number tracking."""

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


class TestLotSerialPhase198(unittest.TestCase):
    """Test lot/serial tracking on moves and quants."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_lot_has_expiry_date(self):
        """stock.lot has expiry_date field."""
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
            Lot = env.get("stock.lot")
            Product = env.get("product.product")
            if not Lot or not Product:
                self.skipTest("Models not loaded")
            product = Product.search([], limit=1)
            if not product.ids:
                self.skipTest("Need product")
            lot = Lot.create({
                "name": "LOT-198-" + str(uuid.uuid4())[:8],
                "product_id": product.ids[0],
                "expiry_date": "2026-12-31",
            })
            self.assertTrue(lot.ids)
            row = lot.read(["expiry_date"])[0]
            self.assertIn("2026", str(row.get("expiry_date", "")))

    def test_move_with_lot_updates_quant(self):
        """Move with lot_id creates/updates quant with that lot."""
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
            Lot = env.get("stock.lot")
            Product = env.get("product.product")
            Location = env.get("stock.location")
            Move = env.get("stock.move")
            Quant = env.get("stock.quant")
            if not all([Lot, Product, Location, Move, Quant]):
                self.skipTest("Models not loaded")
            product = Product.create({"name": "Lot Product 198", "list_price": 10.0})
            stock_loc = Location.search([("type", "=", "internal")], limit=1)
            supplier_loc = Location.search([("type", "=", "supplier")], limit=1)
            if not stock_loc.ids or not supplier_loc.ids:
                self.skipTest("Need internal and supplier locations")
            lot = Lot.create({
                "name": "LOT-M198-" + str(uuid.uuid4())[:8],
                "product_id": product.ids[0],
            })
            move = Move.create({
                "name": "Receipt",
                "product_id": product.ids[0],
                "product_uom_qty": 5.0,
                "lot_id": lot.ids[0],
                "location_id": supplier_loc.ids[0],
                "location_dest_id": stock_loc.ids[0],
                "state": "draft",
            })
            move.write({"state": "done"})
            quants = Quant.search([
                ("product_id", "=", product.ids[0]),
                ("location_id", "=", stock_loc.ids[0]),
                ("lot_id", "=", lot.ids[0]),
            ])
            self.assertEqual(len(quants.ids), 1)
            qty = quants.read(["quantity"])[0].get("quantity", 0)
            self.assertAlmostEqual(float(qty), 5.0, places=2)
