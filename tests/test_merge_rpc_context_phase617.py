"""Phase 617: merge_session_into_rpc_context for call_kw ORM context."""

import unittest

from core.rpc_session_context import merge_session_into_rpc_context


class TestMergeRpcContextPhase617(unittest.TestCase):
    def test_fills_company_and_allowed_when_absent(self):
        kw = {}
        ctx = merge_session_into_rpc_context(kw, 3, [3, 4])
        self.assertEqual(ctx["company_id"], 3)
        self.assertEqual(ctx["allowed_company_ids"], [3, 4])
        self.assertEqual(kw, {})

    def test_respects_explicit_context_company_and_allowed(self):
        kw = {"context": {"company_id": 9, "allowed_company_ids": [9]}}
        ctx = merge_session_into_rpc_context(kw, 1, [1, 2])
        self.assertEqual(ctx["company_id"], 9)
        self.assertEqual(ctx["allowed_company_ids"], [9])

    def test_pops_context_and_preserves_other_kwargs(self):
        kw = {"limit": 5, "context": {"custom": "x"}}
        ctx = merge_session_into_rpc_context(kw, None, [])
        self.assertEqual(ctx["custom"], "x")
        self.assertNotIn("context", kw)
        self.assertEqual(kw.get("limit"), 5)
