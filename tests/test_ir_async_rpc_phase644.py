"""Phase 644: ir.async classmethods stay on RPC whitelist; pdf_async requires auth."""

import unittest

from werkzeug.test import Client

from core.http import Application
from core.http import rpc as rpc_module


class TestIrAsyncRpcPhase644(unittest.TestCase):
    def test_call_kw_whitelist_includes_ir_async_methods(self):
        methods = rpc_module._CLASS_METHODS
        for name in ("call", "call_notify", "run_pending", "gc_done"):
            self.assertIn(name, methods, f"ir.async.{name} must stay whitelisted for /web/dataset/call_kw")

    def test_pdf_async_unauthorized_without_session(self):
        app = Application()
        client = Client(app)
        r = client.get("/report/pdf_async/account.report_invoice/1")
        self.assertEqual(r.status_code, 401)
        self.assertIn(b"Unauthorized", r.data)


if __name__ == "__main__":
    unittest.main()
