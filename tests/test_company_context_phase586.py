"""Phase 586: default company from RPC-style env context."""

import unittest

from core.orm.company_context import default_company_id_for_env


class _MinimalEnv:
    def __init__(self, context=None, uid=1):
        self.context = context or {}
        self.uid = uid

    def get(self, _name):
        return None


class TestCompanyContextPhase586(unittest.TestCase):
    def test_context_company_id_int(self):
        self.assertEqual(default_company_id_for_env(_MinimalEnv({"company_id": 42})), 42)

    def test_context_company_id_tuple(self):
        self.assertEqual(default_company_id_for_env(_MinimalEnv({"company_id": (7,)})), 7)
