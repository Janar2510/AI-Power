"""Tests for RPC read/search_read - Phase 33 regression.

Requires PostgreSQL. Skips if DB unavailable.
"""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.rpc import _call_kw


def _ensure_test_db():
    """Ensure _test_rpc_read DB exists and has data. Returns db name or None."""
    parse_config(["--addons-path=addons"])
    db = "_test_rpc_read"
    if not db_exists(db):
        return None
    return db


class TestRpcRead(unittest.TestCase):
    """Verify search_read returns data when called via _call_kw (RPC path)."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_search_read_returns_data_via_rpc(self):
        """search_read via _call_kw must return non-empty when data exists (Phase 33)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[]], {
            "fields": ["id", "name", "code"],
            "limit": 5,
        })
        self.assertIsInstance(result, list, "search_read must return list")
        self.assertGreater(len(result), 0, "search_read must return rows when data exists")
        row = result[0]
        self.assertIn("id", row)
        self.assertIn("name", row)
        self.assertIn("code", row)

    def test_search_read_with_in_operator(self):
        """search_read with domain [('id','in',[1,2,3])] returns matching rows (Phase 38)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["id", "in", [1, 2, 3]]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        ids = [r["id"] for r in result]
        for i in ids:
            self.assertIn(i, [1, 2, 3], f"id {i} must be in [1,2,3]")

    def test_search_read_with_like_operator(self):
        """search_read with domain [('name','like','Est')] returns case-sensitive matches (Phase 44)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["name", "like", "Est"]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        for r in result:
            self.assertIn("Est", r.get("name", ""), "name must contain 'Est' (case-sensitive)")

    def test_search_read_with_eqlike_operator(self):
        """search_read with domain [('name','=like','Estonia')] returns exact pattern match (Phase 46)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["name", "=like", "Estonia"]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        for r in result:
            self.assertEqual(r.get("name"), "Estonia")

    def test_search_read_with_child_of_operator(self):
        """search_read with domain [('id','child_of',id)] returns record and descendants (Phase 46)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["id", "child_of", 1]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        ids = [r["id"] for r in result]
        self.assertIn(1, ids)

    def test_computed_field_stored_on_create(self):
        """Stored computed field (display_name) is computed on create and returned in search_read (Phase 54)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        rec = _call_kw(1, self.db, "res.partner", "create", [{"name": "ComputedTestPartner"}], {})
        rec_id = rec.ids[0] if rec.ids else getattr(rec, "id", None)
        self.assertIsInstance(rec_id, int)
        result = _call_kw(1, self.db, "res.partner", "search_read", [[["id", "=", rec_id]]], {
            "fields": ["id", "name", "display_name"],
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "ComputedTestPartner")
        self.assertEqual(result[0]["display_name"], "ComputedTestPartner")
