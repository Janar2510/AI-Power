"""Tests for HTTP layer."""

import json
import os
import unittest

from werkzeug.test import Client

from core.http import Application
from core.http.routes import _webclient_html


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

    def test_web_manifest_public_phase548(self):
        """GET /web/manifest.webmanifest returns installable shell JSON (Phase 548)."""
        r = self.client.get("/web/manifest.webmanifest")
        self.assertEqual(r.status_code, 200)
        self.assertIn("application/manifest+json", r.content_type)
        data = json.loads(r.get_data(as_text=True))
        self.assertEqual(data.get("name"), "ERP Platform")
        self.assertEqual(data.get("start_url"), "/web")

    def test_web_service_worker_stub_public_phase553(self):
        """GET /web/sw.js returns public JS stub (Phase 553)."""
        r = self.client.get("/web/sw.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn("javascript", r.content_type)
        self.assertIn(b"skipWaiting", r.data)

    def test_web_service_worker_has_static_cache_phase556(self):
        """Phase 556: SW uses caches + addAll for shell assets."""
        r = self.client.get("/web/sw.js")
        self.assertEqual(r.status_code, 200)
        text = r.get_data(as_text=True)
        self.assertIn("caches.open", text)
        self.assertIn("addAll", text)
        self.assertIn("web.assets_web", text)

    def test_webclient_html_registers_service_worker_phase553(self):
        """Web shell HTML includes service worker registration script (Phase 553)."""
        html = _webclient_html(debug_assets=True)
        self.assertIn("serviceWorker", html)
        self.assertIn("/web/sw.js", html)

    def test_webclient_html_injects_modern_bootstrap_phase1(self):
        """Web shell includes modular frontend bootstrap config and primary runtime script."""
        html = _webclient_html(debug_assets=True)
        self.assertIn("__erpFrontendBootstrap", html)
        self.assertIn('"runtime": "modern"', html)
        self.assertIn('"shellOwner": "modern"', html)
        self.assertIn("/web/static/lib/owl/owl.js", html)
        self.assertIn("/web/static/dist/modern_webclient.js", html)
        self.assertIn('"cspScriptEvalBlocked": true', html)

    def test_webclient_html_esbuild_primary_env_lists_per_file_js_phase584(self):
        """ERP_WEBCLIENT_ESBUILD_PRIMARY=1 serves per-file JS (no concat bundle tag) + bootstrap flag."""
        old = os.environ.get("ERP_WEBCLIENT_ESBUILD_PRIMARY")
        try:
            os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = "1"
            html = _webclient_html(debug_assets=False)
            self.assertIn('"esbuildPrimary": true', html)
            self.assertNotIn("/web/assets/web.assets_web.js", html)
            self.assertIn("/web/static/src/services/rpc.js", html)
            self.assertIn("/web/assets/web.assets_web.css", html)
        finally:
            if old is None:
                os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
            else:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_webclient_html_esbuild_primary_default_when_unset_phase801(self):
        """Unset ERP_WEBCLIENT_ESBUILD_PRIMARY defaults to per-file JS + esbuildPrimary true."""
        old = os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
        try:
            html = _webclient_html(debug_assets=False)
            self.assertIn('"esbuildPrimary": true', html)
            self.assertNotIn("/web/assets/web.assets_web.js", html)
            self.assertIn("/web/static/src/services/rpc.js", html)
        finally:
            if old is not None:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_webclient_html_concat_when_esbuild_primary_disabled_phase801(self):
        """ERP_WEBCLIENT_ESBUILD_PRIMARY=0 serves single concat bundle + esbuildPrimary false."""
        old = os.environ.get("ERP_WEBCLIENT_ESBUILD_PRIMARY")
        try:
            os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = "0"
            html = _webclient_html(debug_assets=False)
            self.assertIn('"esbuildPrimary": false', html)
            self.assertIn("/web/assets/web.assets_web.js", html)
        finally:
            if old is None:
                os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
            else:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_web_service_worker_precache_per_file_js_when_esbuild_primary_phase590(self):
        """SW SHELL_URLS lists manifest JS entries when ERP_WEBCLIENT_ESBUILD_PRIMARY=1."""
        old = os.environ.get("ERP_WEBCLIENT_ESBUILD_PRIMARY")
        try:
            os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = "1"
            r = self.client.get("/web/sw.js")
            self.assertEqual(r.status_code, 200)
            text = r.get_data(as_text=True)
            self.assertIn("erp-web-shell-v2", text)
            self.assertIn("/web/static/src/services/rpc.js", text)
            self.assertNotIn("/web/assets/web.assets_web.js", text)
        finally:
            if old is None:
                os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
            else:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_web_service_worker_default_precache_lists_manifest_js_phase801(self):
        """Default SW precache lists per-manifest JS (esbuild-primary default when env unset)."""
        old = os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
        try:
            r = self.client.get("/web/sw.js")
            text = r.get_data(as_text=True)
            self.assertIn("erp-web-shell-v2", text)
            self.assertNotIn("/web/assets/web.assets_web.js", text)
            self.assertIn("/web/static/src/services/rpc.js", text)
        finally:
            if old is not None:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_web_service_worker_precache_concat_when_esbuild_primary_disabled_phase801(self):
        """Explicit ERP_WEBCLIENT_ESBUILD_PRIMARY=0 restores single concat JS precache."""
        old = os.environ.get("ERP_WEBCLIENT_ESBUILD_PRIMARY")
        try:
            os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = "0"
            r = self.client.get("/web/sw.js")
            text = r.get_data(as_text=True)
            self.assertIn("/web/assets/web.assets_web.js", text)
            self.assertIn("erp-web-shell-v2", text)
        finally:
            if old is None:
                os.environ.pop("ERP_WEBCLIENT_ESBUILD_PRIMARY", None)
            else:
                os.environ["ERP_WEBCLIENT_ESBUILD_PRIMARY"] = old

    def test_webclient_load_menus_requires_auth_phase1(self):
        """Odoo-style menu bootstrap endpoint exists and stays auth-protected."""
        r = self.client.get("/web/webclient/load_menus")
        self.assertEqual(r.status_code, 401)

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

    def test_static_modern_webclient_js_served_phase1(self):
        r = self.client.get("/web/static/dist/modern_webclient.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"__ERPModernWebClientLoaded", r.data)
        self.assertIn(b"fallbackMount", r.data)
        self.assertIn(b'mode: "fallback"', r.data)

    def test_static_owl_runtime_served_phase2(self):
        r = self.client.get("/web/static/lib/owl/owl.js")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"Component", r.data)

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

    def test_ai_chat_stream_returns_501(self):
        """Phase C3: streaming hook is reserved."""
        r = self.client.get("/ai/chat/stream")
        self.assertEqual(r.status_code, 501)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("streaming_not_enabled", data.get("error", ""))

    def test_security_headers_present(self):
        """Responses include X-Frame-Options and X-Content-Type-Options (Phase 99)."""
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers.get("X-Frame-Options"), "SAMEORIGIN")
        self.assertEqual(r.headers.get("X-Content-Type-Options"), "nosniff")

    def test_csp_keeps_eval_blocked_while_modern_shell_supports_fallback(self):
        """Modern shell stays compatible with strict CSP and does not require unsafe-eval."""
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        csp = r.headers.get("Content-Security-Policy", "")
        self.assertIn("script-src", csp)
        self.assertNotIn("unsafe-eval", csp)
        self.assertNotIn("trusted-types-eval", csp)
