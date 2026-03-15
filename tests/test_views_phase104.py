"""Phase 104: Extended views + widgets - Html, Image, activity view, many2many_tags."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestViewsPhase104(unittest.TestCase):
    """Phase 104: Html field, many2many_tags, activity view grouping."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_html_field_stores_and_reads(self):
        """Html field (note_html) stores and returns HTML content (Phase 104)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Lead = env.get("crm.lead")
            if not Lead:
                self.skipTest("crm.lead not loaded")
            html_content = "<p>Hello <strong>world</strong></p>"
            lead = Lead.create({"name": "HtmlTestLead", "type": "lead", "note_html": html_content})
            self.assertIsNotNone(lead)
            lead_id = lead.id if hasattr(lead, "id") else lead.ids[0]
            rows = Lead.browse([lead_id]).read(["note_html"])
            self.assertTrue(len(rows) > 0)
            self.assertEqual(rows[0].get("note_html"), html_content)

    def test_activity_view_groups_by_state(self):
        """Activity view groups activities by overdue/today/planned (Phase 104)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Lead = env.get("crm.lead")
            Activity = env.get("mail.activity")
            if not Lead or not Activity:
                self.skipTest("crm.lead or mail.activity not loaded")
            lead = Lead.create({"name": "ActivityTestLead", "type": "opportunity"})
            lead_id = lead.id if hasattr(lead, "id") else lead.ids[0]
            from datetime import date, timedelta
            today = date.today().isoformat()
            yesterday = (date.today() - timedelta(days=1)).isoformat()
            tomorrow = (date.today() + timedelta(days=1)).isoformat()
            Activity.create({"res_model": "crm.lead", "res_id": lead_id, "summary": "Overdue", "date_deadline": yesterday})
            Activity.create({"res_model": "crm.lead", "res_id": lead_id, "summary": "Today", "date_deadline": today})
            Activity.create({"res_model": "crm.lead", "res_id": lead_id, "summary": "Planned", "date_deadline": tomorrow})
            activities = Activity.search([["res_model", "=", "crm.lead"], ["res_id", "=", lead_id]]).read(["date_deadline", "summary"])
            today_str = today

            def d_str(a):
                v = a.get("date_deadline")
                return str(v)[:10] if v else ""

            overdue = [a for a in activities if d_str(a) and d_str(a) < today_str]
            today_list = [a for a in activities if d_str(a) == today_str]
            planned = [a for a in activities if d_str(a) and d_str(a) > today_str]
            self.assertEqual(len(overdue), 1, "One overdue activity")
            self.assertEqual(len(today_list), 1, "One today activity")
            self.assertEqual(len(planned), 1, "One planned activity")
