"""Phase 113: Multi-db and session verification."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists, create_database
from core.http.session import create_session, get_session


def _ensure_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    if not db_exists(dbname):
        try:
            create_database(dbname)
        except Exception:
            return False
    return db_exists(dbname)


class TestMultiDbPhase113(unittest.TestCase):
    """Phase 113: session per DB, registry per DB."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db1 = "_test_phase113_a"
        cls.db2 = "_test_phase113_b"
        cls._has_dbs = _ensure_db(cls.db1) and _ensure_db(cls.db2)

    def test_session_stores_db(self):
        """Session stores db name; get_session returns correct db."""
        if not self._has_dbs:
            self.skipTest("PostgreSQL not available")
        sid = create_session(1, self.db1)
        sess = get_session(sid)
        self.assertIsNotNone(sess)
        self.assertEqual(sess.get("db"), self.db1)
        sid2 = create_session(1, self.db2)
        sess2 = get_session(sid2)
        self.assertIsNotNone(sess2)
        self.assertEqual(sess2.get("db"), self.db2)
        self.assertNotEqual(sid, sid2)

    def test_registry_per_db(self):
        """Each DB has its own registry; data in one DB not visible in another."""
        if not self._has_dbs:
            self.skipTest("PostgreSQL not available")
        from core.orm.models import ModelBase
        load_module_graph()
        with get_cursor(self.db1) as cr1:
            reg1 = Registry(self.db1)
            ModelBase._registry = reg1
            init_schema(cr1, reg1)
            env1 = Environment(reg1, cr=cr1, uid=1)
            reg1.set_env(env1)
            Partner = env1.get("res.partner")
            if Partner:
                p1 = Partner.create({"name": "DB1 Partner", "email": "db1@test.com"})
                id1 = p1.ids[0] if p1.ids else p1.id
        with get_cursor(self.db2) as cr2:
            reg2 = Registry(self.db2)
            ModelBase._registry = reg2
            init_schema(cr2, reg2)
            env2 = Environment(reg2, cr=cr2, uid=1)
            reg2.set_env(env2)
            Partner2 = env2.get("res.partner")
            if Partner2:
                partners = Partner2.search([("name", "=", "DB1 Partner")])
                self.assertEqual(len(partners), 0, "DB2 should not see DB1 data")
