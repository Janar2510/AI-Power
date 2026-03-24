"""Phase 555: fiscal_position_id defaults from res.partner on SO/PO create (DB optional)."""

import unittest
import uuid

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountFiscalPartnerDefaultPhase555(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_sale_order_gets_fiscal_from_partner(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            FP = env.get("account.fiscal.position")
            Partner = env.get("res.partner")
            Sale = env.get("sale.order")
            if not all([FP, Partner, Sale]):
                self.skipTest("models missing")

            fp = FP.create({"name": "555 SO " + uuid.uuid4().hex[:4]})
            fp_id = fp.ids[0]
            partner = Partner.create({"name": "555 Customer", "fiscal_position_id": fp_id})
            pid = partner.ids[0]
            so = Sale.create({"partner_id": pid, "state": "draft"})
            row = so.read(["fiscal_position_id"])[0]
            got = row.get("fiscal_position_id")
            got_id = got[0] if isinstance(got, (list, tuple)) and got else got
            self.assertEqual(got_id, fp_id)

    def test_purchase_order_gets_fiscal_from_partner(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            FP = env.get("account.fiscal.position")
            Partner = env.get("res.partner")
            PO = env.get("purchase.order")
            if not all([FP, Partner, PO]):
                self.skipTest("models missing")

            fp = FP.create({"name": "555 PO " + uuid.uuid4().hex[:4]})
            fp_id = fp.ids[0]
            vendor = Partner.create({"name": "555 Vendor", "fiscal_position_id": fp_id})
            vid = vendor.ids[0]
            po = PO.create({"partner_id": vid, "state": "draft"})
            row = po.read(["fiscal_position_id"])[0]
            got = row.get("fiscal_position_id")
            got_id = got[0] if isinstance(got, (list, tuple)) and got else got
            self.assertEqual(got_id, fp_id)

    def test_explicit_sale_fiscal_overrides_partner(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            FP = env.get("account.fiscal.position")
            Partner = env.get("res.partner")
            Sale = env.get("sale.order")
            if not all([FP, Partner, Sale]):
                self.skipTest("models missing")

            fp_a = FP.create({"name": "555-A-" + uuid.uuid4().hex[:4]}).ids[0]
            fp_b = FP.create({"name": "555-B-" + uuid.uuid4().hex[:4]}).ids[0]
            partner = Partner.create({"name": "555 Override", "fiscal_position_id": fp_a})
            pid = partner.ids[0]
            so = Sale.create({"partner_id": pid, "state": "draft", "fiscal_position_id": fp_b})
            row = so.read(["fiscal_position_id"])[0]
            got = row.get("fiscal_position_id")
            got_id = got[0] if isinstance(got, (list, tuple)) and got else got
            self.assertEqual(got_id, fp_b)
