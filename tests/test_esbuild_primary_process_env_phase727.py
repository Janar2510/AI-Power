"""Phase 727: CI matrix — _webclient_html respects process-wide ERP_WEBCLIENT_ESBUILD_PRIMARY=1."""

import os
import unittest
from pathlib import Path


class TestEsbuildPrimaryProcessEnvPhase727(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.routes_src = (cls.root / "core/http/routes.py").read_text(encoding="utf-8")

    def test_routes_read_esbuild_primary_from_environ(self):
        self.assertIn("ERP_WEBCLIENT_ESBUILD_PRIMARY", self.routes_src)
        self.assertIn("esbuildPrimary", self.routes_src)

    def test_webclient_html_when_process_env_exported(self):
        if os.environ.get("ERP_WEBCLIENT_ESBUILD_PRIMARY") != "1":
            self.skipTest("CI runs this step with ERP_WEBCLIENT_ESBUILD_PRIMARY=1")
        try:
            from core.http.routes import _webclient_html
        except ImportError as exc:
            self.skipTest("HTTP stack deps missing (install requirements.txt): %s" % exc)
        html = _webclient_html(debug_assets=False)
        self.assertIn('"esbuildPrimary": true', html)
        self.assertNotIn("/web/assets/web.assets_web.js", html)


if __name__ == "__main__":
    unittest.main()
