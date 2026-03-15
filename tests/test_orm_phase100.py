"""Phase 100: @api.depends, ondelete cascade, field inverse."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    """Return True if DB exists and can be used."""
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestORMPhase100(unittest.TestCase):
    """Phase 100: @api.depends recompute, ondelete cascade."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_depends_recompute_on_related_change(self):
        """When res.partner.name changes, crm.lead.partner_name recomputes (Phase 100)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            Partner = env.get("res.partner")
            Lead = env.get("crm.lead")
            if not Partner or not Lead:
                self.skipTest("res.partner or crm.lead not loaded")
            partner = Partner.create({"name": "Phase100 Partner"})
            lead = Lead.create({"name": "Test Lead", "partner_id": partner.id})
            self.assertEqual(lead.read(["partner_name"])[0].get("partner_name"), "Phase100 Partner")
            partner.write({"name": "Updated Name"})
            row = lead.read(["partner_name"])[0]
            self.assertEqual(row.get("partner_name"), "Updated Name", "partner_name must recompute on partner.name change")

    def test_ondelete_cascade_removes_children(self):
        """When parent is unlinked with ondelete=cascade, children are unlinked (Phase 100)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        from core.orm import Model, fields

        class Parent(Model):
            _name = "test.phase100.parent"
            _description = "Phase100 Parent"
            name = fields.Char()

        class Child(Model):
            _name = "test.phase100.child"
            _description = "Phase100 Child"
            name = fields.Char()
            parent_id = fields.Many2one("test.phase100.parent", ondelete="cascade")

        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        registry.register_model("test.phase100.parent", Parent)
        registry.register_model("test.phase100.child", Child)
        Parent._registry = Child._registry = registry
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            p = Parent.create({"name": "Parent"})
            c = Child.create({"name": "Child", "parent_id": p.id})
            child_id = c.id
            Parent(env, p.ids).unlink()
            remaining = Child.search([("id", "=", child_id)])
            self.assertEqual(len(remaining), 0, "Child must be cascade-deleted when parent unlinks")
