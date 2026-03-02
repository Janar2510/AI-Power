"""Tests for HTTP layer."""

import json
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
