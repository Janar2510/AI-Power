"""Phase 254: Domain operators - any!, not any!."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.domains import (
    STANDARD_CONDITION_OPERATORS,
    INTERNAL_CONDITION_OPERATORS,
    NEGATIVE_CONDITION_OPERATORS,
    _TRUE_LEAF,
    _FALSE_LEAF,
)
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestOrmDomainsPhase254(unittest.TestCase):
    """Test domain operator constants and any!/not any! in search."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_orm_domains_254"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_standard_operators_include_any(self):
        """STANDARD_CONDITION_OPERATORS includes any, not any, any!, not any!."""
        self.assertIn("any", STANDARD_CONDITION_OPERATORS)
        self.assertIn("not any", STANDARD_CONDITION_OPERATORS)
        self.assertIn("any!", INTERNAL_CONDITION_OPERATORS)
        self.assertIn("not any!", INTERNAL_CONDITION_OPERATORS)

    def test_internal_operators(self):
        """INTERNAL_CONDITION_OPERATORS is only any! and not any!."""
        self.assertEqual(INTERNAL_CONDITION_OPERATORS, frozenset(("any!", "not any!")))

    def test_negative_operators(self):
        """NEGATIVE_CONDITION_OPERATORS maps not any! to any!."""
        self.assertEqual(NEGATIVE_CONDITION_OPERATORS.get("not any!"), "any!")

    def test_true_false_leaf(self):
        """_TRUE_LEAF and _FALSE_LEAF are defined."""
        self.assertEqual(_TRUE_LEAF, (1, "=", 1))
        self.assertEqual(_FALSE_LEAF, (0, "=", 1))

    def test_any_subquery_many2one(self):
        """(parent_id, 'any!', domain) filters by related parent."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_domains_254")
        with get_cursor(self.db) as cr:
            parse_config(["--addons-path=" + self._addons_path])
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            parent = Partner.create({"name": "DomainAnyTest Parent"})
            child = Partner.create({"name": "DomainAnyTest Child", "parent_id": parent.id})
            recs = Partner.search([("parent_id", "any!", [("name", "=", "DomainAnyTest Parent")])])
            self.assertIn(child.id, recs.ids)
