"""Phase 205: Audit trail."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestAuditPhase205(unittest.TestCase):
    """Test audit log model and creation on write."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_audit_log_model_exists(self):
        """audit.log model is registered."""
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
            AuditLog = env.get("audit.log")
            self.assertIsNotNone(AuditLog)

    def test_audit_on_sale_order_write(self):
        """Writing sale.order creates audit.log entry."""
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
            AuditLog = env.get("audit.log")
            if not all([SaleOrder, Partner, AuditLog]):
                self.skipTest("Models not loaded")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Audit Test"})
            order = SaleOrder.create({"partner_id": partner.ids[0], "state": "draft"})
            oid = order.ids[0] if order.ids else order.id
            count_before = AuditLog.search_count([("model", "=", "sale.order"), ("res_id", "=", oid)])
            order.write({"state": "sale"})
            count_after = AuditLog.search_count([("model", "=", "sale.order"), ("res_id", "=", oid)])
            self.assertGreater(count_after, count_before)
