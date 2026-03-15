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

    def test_report_html_renders_from_db_metadata_when_registry_map_empty(self):
        """Phase 110: report lookup should come from persisted metadata, not only hard-coded map."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        from core.http.rpc import _call_kw
        from core.http import report as report_mod

        # Ensure ir.actions.report record exists (init_data or upgrade may not have run)
        try:
            existing = _call_kw(1, self.db, "ir.actions.report", "search_read", [[["report_name", "=", "crm.lead_summary"]]], {"limit": 1})
            if not (existing and isinstance(existing, list) and existing):
                _call_kw(1, self.db, "ir.actions.report", "create", [{
                    "name": "Lead Summary",
                    "model": "crm.lead",
                    "report_name": "crm.lead_summary",
                    "report_file": "crm/report/lead_summary.html",
                    "fields_csv": "id,name,type,stage_id,expected_revenue,date_deadline,description",
                }], {})
        except Exception as e:
            if "does not exist" in str(e) or "UndefinedTable" in str(type(e).__name__):
                self.skipTest("ir_actions_report table missing; run: ./erp-bin db init -d _test_rpc_read")
            raise

        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "DbReportLead", "type": "lead"}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)

        sid = create_session(1, self.db)
        builder = EnvironBuilder(path="/report/html/crm.lead_summary/" + str(lead_id), method="GET")
        builder.headers["Cookie"] = "erp_session=" + sid
        env = builder.get_environ()
        req = ERPRequest(env)

        original = dict(report_mod._REPORT_REGISTRY)
        try:
            report_mod._REPORT_REGISTRY.clear()
            resp = handle_report(req)
        finally:
            report_mod._REPORT_REGISTRY.clear()
            report_mod._REPORT_REGISTRY.update(original)

        self.assertIsNotNone(resp)
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        self.assertIn("DbReportLead", html)
