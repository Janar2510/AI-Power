"""Tests for the JSON-RPC endpoint security (Phase 1.250.16)."""

import json
import unittest

from werkzeug.test import Client

from core.http import Application


class TestRpcSecurity(unittest.TestCase):
    def setUp(self):
        self.app = Application()
        self.client = Client(self.app)

    def _post_jsonrpc(self, method, params=None, req_id=1):
        payload = json.dumps(
            {"jsonrpc": "2.0", "method": method, "params": params or {}, "id": req_id}
        ).encode()
        return self.client.post(
            "/web/jsonrpc",
            data=payload,
            content_type="application/json",
        )

    def test_unknown_method_returns_error_not_echo(self):
        """Unknown RPC methods must return -32601 MethodNotFound, not echo params."""
        r = self._post_jsonrpc("totally.unknown.method.xyz", {"secret": "data"})
        self.assertIn(r.status_code, (404, 200))  # 404 preferred; 200 for wire-compat
        body = json.loads(r.data)
        self.assertIn("error", body, "Response must contain error key")
        self.assertEqual(
            body["error"]["code"],
            -32601,
            "Error code must be -32601 Method Not Found",
        )
        # Params must NOT be echoed back
        self.assertNotIn("secret", json.dumps(body), "Params must not be echoed")

    def test_unknown_method_does_not_return_200_ok_with_result(self):
        """Old behaviour was 200 + result: echo. This must no longer happen."""
        r = self._post_jsonrpc("some.nonexistent.rpc")
        body = json.loads(r.data)
        # There must be no 'result' key with a non-null value
        result = body.get("result")
        self.assertIsNone(result, "'result' should be absent or null for unknown methods")

    def test_call_kw_unknown_method_returns_error(self):
        """`call_kw` with a method that doesn't exist on the model returns an error."""
        payload = json.dumps({
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": "res.partner",
                "method": "nonexistent_method_abc123",
                "args": [],
                "kwargs": {},
            },
            "id": 42,
        }).encode()
        r = self.client.post(
            "/web/dataset/call_kw",
            data=payload,
            content_type="application/json",
        )
        body = json.loads(r.data)
        # call_kw returns either an error or raises (mapped to error response)
        self.assertIn("error", body, "call_kw with nonexistent method must return error")
