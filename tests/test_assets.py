"""Tests for asset bundle resolution."""

import unittest

from core.modules.assets import (
    resolve_bundle_assets,
    get_bundle_content,
    get_bundle_urls,
)


class TestAssets(unittest.TestCase):
    def setUp(self):
        from core.tools import config
        config.parse_config(["--addons-path=addons"])

    def test_resolve_web_assets_web(self):
        """web.assets_web should resolve to css and js files."""
        resolved = resolve_bundle_assets("web.assets_web")
        self.assertIn("css", resolved)
        self.assertIn("js", resolved)
        # Web module has: webclient.css, session.js, main.js
        css_paths = [p for p, _ in resolved["css"]]
        js_paths = [p for p, _ in resolved["js"]]
        self.assertGreater(len(css_paths), 0, "Should have at least one CSS file")
        self.assertGreater(len(js_paths), 0, "Should have at least one JS file")

    def test_get_bundle_content_css(self):
        """Bundle CSS content should be non-empty."""
        content, mimetype = get_bundle_content("web.assets_web", "css")
        self.assertEqual(mimetype, "text/css")
        self.assertGreater(len(content), 0)

    def test_get_bundle_content_js(self):
        """Bundle JS content should be non-empty."""
        content, mimetype = get_bundle_content("web.assets_web", "js")
        self.assertEqual(mimetype, "application/javascript")
        self.assertGreater(len(content), 0)

    def test_get_bundle_urls(self):
        """Debug mode URLs should be individual static paths."""
        urls = get_bundle_urls("web.assets_web")
        self.assertIn("css", urls)
        self.assertIn("js", urls)
        for u in urls["css"]:
            self.assertTrue(u.startswith("/"), f"URL should start with /: {u}")
            self.assertIn("static", u)
        for u in urls["js"]:
            self.assertTrue(u.startswith("/"), f"URL should start with /: {u}")
            self.assertIn("static", u)
        js_flat = " ".join(urls["js"])
        self.assertIn("rpc_deadline.js", js_flat)
        self.assertIn("route_apply_plugin_keyboard_shortcuts.js", js_flat)
        self.assertIn("route_apply_plugin_client_info.js", js_flat)
        self.assertIn("route_apply_plugin_discuss.js", js_flat)
        self.assertIn("route_apply_plugin_reports.js", js_flat)
        self.assertIn("route_apply_plugin_settings.js", js_flat)
        self.assertIn("route_apply_plugin_website.js", js_flat)
        self.assertIn("route_apply_plugin_ecommerce.js", js_flat)
