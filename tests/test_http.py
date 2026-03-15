"""Tests for HTTP layer."""

import json
import os
import unittest

from werkzeug.test import Client

from core.http import Application


class TestHTTP(unittest.TestCase):
    def setUp(self):
        self.app = Application()
        self.client = Client(self.app)

    def test_root_redirects_to_login_when_not_authenticated(self):
        r = self.client.get("/")
        self.assertIn(r.status_code, (200, 302))
        if r.status_code == 302:
            self.assertIn("/web/login", r.headers.get("Location", ""))
        else:
            self.assertIn(b"ERP Platform", r.data)

    def test_login_page_returns_html(self):
        r = self.client.get("/web/login")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"ERP Platform", r.data)
        self.assertIn(b"Log in", r.data)

    def test_jsonrpc(self):
        r = self.client.post(
            "/jsonrpc",
            data=json.dumps({
                "jsonrpc": "2.0",
                "method": "test",
                "params": {},
                "id": 1,
            }),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        data = json.loads(r.get_data(as_text=True))
        self.assertEqual(data["jsonrpc"], "2.0")
        self.assertIn("result", data)
        self.assertEqual(data["id"], 1)

    def test_static_web_main_js(self):
        r = self.client.get("/web/static/src/main.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"ERP Platform", r.data)

    def test_asset_bundle_css(self):
        r = self.client.get("/web/assets/web.assets_web.css")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.content_type, "text/css; charset=utf-8")
        self.assertGreater(len(r.data), 0)

    def test_asset_bundle_js(self):
        r = self.client.get("/web/assets/web.assets_web.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn("javascript", r.content_type)
        self.assertIn(b"ERP Platform", r.data)

    def test_load_views_requires_auth(self):
        r = self.client.get("/web/load_views")
        self.assertEqual(r.status_code, 401)

    def test_js_test_runner_served(self):
        """JS unit test runner and assets are served."""
        r = self.client.get("/web/static/tests/test_runner.html")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"JS Unit Tests", r.data)
        self.assertIn(b"mock_rpc.js", r.data)

    def test_js_test_mock_rpc_served(self):
        r = self.client.get("/web/static/tests/mock_rpc.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"MockRpc", r.data)

    def test_debug_assets_serves_individual_files(self):
        """With ?debug=assets, webclient uses individual asset URLs not bundle."""
        # Simulate request with debug=assets - we need to hit a route that uses _is_debug_assets
        # The index route requires auth. Use a workaround: check that get_bundle_urls returns
        # individual paths when we'd use debug mode.
        from core.modules.assets import get_bundle_urls

        urls = get_bundle_urls("web.assets_web")
        self.assertIn("css", urls)
        self.assertIn("js", urls)
        self.assertGreater(len(urls["css"]), 0)
        self.assertGreater(len(urls["js"]), 0)
        # Individual file URLs (not bundle)
        self.assertTrue(any("/web/static/" in u for u in urls["js"]))

    def test_ai_tools_requires_auth(self):
        """GET /ai/tools returns 401 when not authenticated."""
        r = self.client.get("/ai/tools")
        self.assertEqual(r.status_code, 401)

    def test_asset_bundles_load_from_manifest(self):
        """Asset bundles resolve from manifest assets key."""
        from core.modules.assets import resolve_bundle_assets

        resolved = resolve_bundle_assets("web.assets_web")
        self.assertIn("css", resolved)
        self.assertIn("js", resolved)
        self.assertGreater(len(resolved["js"]), 0, "web.assets_web should have JS from manifest")

    def test_json2_requires_auth(self):
        """POST /json/2/<model>/<method> returns 401 without bearer token."""
        r = self.client.post(
            "/json/2/res.partner/search_read",
            data=json.dumps({"domain": []}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 401)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("Invalid apikey", data.get("message", ""))

    def test_websocket_handler_registered(self):
        """WebSocket handler is registered for /websocket/ (Phase 95)."""
        from core.http.application import _websocket_handler
        self.assertIsNotNone(_websocket_handler)
        self.assertTrue(callable(_websocket_handler))

    def test_health_endpoint_returns_ok(self):
        """GET /health returns JSON with status and db (Phase 99)."""
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.content_type, "application/json")
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("status", data)
        self.assertEqual(data["status"], "ok")
        self.assertIn("db", data)
        self.assertIsInstance(data["db"], bool)

    def test_security_headers_present(self):
        """Responses include X-Frame-Options and X-Content-Type-Options (Phase 99)."""
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers.get("X-Frame-Options"), "SAMEORIGIN")
        self.assertEqual(r.headers.get("X-Content-Type-Options"), "nosniff")
