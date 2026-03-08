"""Tests for report rendering (Phase 87)."""

import unittest

from werkzeug.test import Client, EnvironBuilder
from werkzeug.wrappers import Request

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.db import init_schema
from core.sql_db import db_exists, get_cursor
from core.http import Application
from core.http.session import create_session
from core.http.report import handle_report
from core.http.request import Request as ERPRequest


def _ensure_test_db():
    parse_config(["--addons-path=addons"])
    db = "_test_rpc_read"
    if not db_exists(db):
        return None
    return db


class TestReport(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_report_html_renders(self):
        """Fetch HTML report, verify it contains record data (Phase 87)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        from core.http.rpc import _call_kw
        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "ReportTestLead", "type": "opportunity"}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)

        sid = create_session(1, self.db)
        builder = EnvironBuilder(path="/report/html/crm.lead_summary/" + str(lead_id), method="GET")
        builder.headers["Cookie"] = "erp_session=" + sid
        env = builder.get_environ()
        req = ERPRequest(env)

        resp = handle_report(req)
        self.assertIsNotNone(resp)
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        self.assertIn("ReportTestLead", html)
        self.assertIn("opportunity", html)
