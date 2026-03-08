"""Tests for RPC read/search_read - Phase 33 regression.

Requires PostgreSQL. Skips if DB unavailable.
"""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.rpc import _call_kw


def _ensure_test_db():
    """Ensure _test_rpc_read DB exists and has data. Returns db name or None."""
    parse_config(["--addons-path=addons"])
    db = "_test_rpc_read"
    if not db_exists(db):
        return None
    return db


class TestRpcRead(unittest.TestCase):
    """Verify search_read returns data when called via _call_kw (RPC path)."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_search_read_returns_data_via_rpc(self):
        """search_read via _call_kw must return non-empty when data exists (Phase 33)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[]], {
            "fields": ["id", "name", "code"],
            "limit": 5,
        })
        self.assertIsInstance(result, list, "search_read must return list")
        self.assertGreater(len(result), 0, "search_read must return rows when data exists")
        row = result[0]
        self.assertIn("id", row)
        self.assertIn("name", row)
        self.assertIn("code", row)

    def test_search_read_with_in_operator(self):
        """search_read with domain [('id','in',[1,2,3])] returns matching rows (Phase 38)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["id", "in", [1, 2, 3]]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        ids = [r["id"] for r in result]
        for i in ids:
            self.assertIn(i, [1, 2, 3], f"id {i} must be in [1,2,3]")

    def test_search_read_with_like_operator(self):
        """search_read with domain [('name','like','Est')] returns case-sensitive matches (Phase 44)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["name", "like", "Est"]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        for r in result:
            self.assertIn("Est", r.get("name", ""), "name must contain 'Est' (case-sensitive)")

    def test_search_read_with_eqlike_operator(self):
        """search_read with domain [('name','=like','Estonia')] returns exact pattern match (Phase 46)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["name", "=like", "Estonia"]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        for r in result:
            self.assertEqual(r.get("name"), "Estonia")

    def test_search_read_with_child_of_operator(self):
        """search_read with domain [('id','child_of',id)] returns record and descendants (Phase 46)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "res.country", "search_read", [[["id", "child_of", 1]]], {
            "fields": ["id", "name"],
            "limit": 10,
        })
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        ids = [r["id"] for r in result]
        self.assertIn(1, ids)

    def test_computed_field_stored_on_create(self):
        """Stored computed field (display_name) is computed on create and returned in search_read (Phase 54)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        rec = _call_kw(1, self.db, "res.partner", "create", [{"name": "ComputedTestPartner"}], {})
        rec_id = rec.ids[0] if rec.ids else getattr(rec, "id", None)
        self.assertIsInstance(rec_id, int)
        result = _call_kw(1, self.db, "res.partner", "search_read", [[["id", "=", rec_id]]], {
            "fields": ["id", "name", "display_name"],
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "ComputedTestPartner")
        self.assertEqual(result[0]["display_name"], "ComputedTestPartner")

    def test_binary_field_create_and_read(self):
        """Binary field (datas) stores base64 and returns base64 in search_read (Phase 55)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        import base64
        payload = base64.b64encode(b"hello binary").decode("ascii")
        rec = _call_kw(1, self.db, "ir.attachment", "create", [{"name": "test.txt", "datas": payload}], {})
        rec_id = rec.ids[0] if rec.ids else getattr(rec, "id", None)
        self.assertIsInstance(rec_id, int)
        result = _call_kw(1, self.db, "ir.attachment", "search_read", [[["id", "=", rec_id]]], {
            "fields": ["id", "name", "datas"],
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "test.txt")
        decoded = base64.b64decode(result[0]["datas"])
        self.assertEqual(decoded, b"hello binary")

    def test_related_field_stored_on_create(self):
        """Stored related field (partner_name) is computed from partner_id.name (Phase 59)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        partner = _call_kw(1, self.db, "res.partner", "create", [{"name": "RelatedTestPartner"}], {})
        partner_id = partner.ids[0] if partner.ids else getattr(partner, "id", None)
        self.assertIsInstance(partner_id, int)
        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "Test Lead", "partner_id": partner_id}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)
        result = _call_kw(1, self.db, "crm.lead", "search_read", [[["id", "=", lead_id]]], {
            "fields": ["id", "name", "partner_id", "partner_name"],
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["partner_id"], partner_id)
        self.assertEqual(result[0]["partner_name"], "RelatedTestPartner")

    def test_related_field_multi_level(self):
        """Multi-level Related (country_id.code) is computed and stored (Phase 68)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        country = _call_kw(1, self.db, "res.country", "search_read", [[["code", "=", "EE"]]], {"fields": ["id", "code"], "limit": 1})
        country_id = country[0]["id"] if country else None
        if not country_id:
            self.skipTest("No res.country with code EE in test DB")
        partner = _call_kw(1, self.db, "res.partner", "create", [{"name": "MultiLevelPartner", "country_id": country_id}], {})
        partner_id = partner.ids[0] if partner.ids else getattr(partner, "id", None)
        self.assertIsInstance(partner_id, int)
        result = _call_kw(1, self.db, "res.partner", "search_read", [[["id", "=", partner_id]]], {
            "fields": ["id", "name", "country_id", "country_code"],
        })
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["country_id"], country_id)
        self.assertEqual(result[0]["country_code"], "EE")

    def test_name_get_returns_display_name(self):
        """name_get returns [(id, display_name), ...] (Phase 70)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        partner = _call_kw(1, self.db, "res.partner", "create", [{"name": "NameGetPartner"}], {})
        pid = partner.ids[0] if partner.ids else getattr(partner, "id", None)
        self.assertIsInstance(pid, int)
        result = _call_kw(1, self.db, "res.partner", "name_get", [[pid]], {})
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0][0], pid)
        self.assertEqual(result[0][1], "NameGetPartner")

    def test_name_search_filters_by_name(self):
        """name_search returns matching records in name_get format (Phase 70)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        _call_kw(1, self.db, "res.partner", "create", [{"name": "NameSearchUniqueXyZ"}], {})
        result = _call_kw(1, self.db, "res.partner", "name_search", ["NameSearchUniqueXyZ", [], "ilike", 8], {})
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        self.assertIn("NameSearchUniqueXyZ", result[0][1])

    def test_copy_creates_duplicate(self):
        """copy(id) creates duplicate with ' (copy)' suffix (Phase 72)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        partner = _call_kw(1, self.db, "res.partner", "create", [{"name": "CopyTestPartner"}], {})
        pid = partner.ids[0] if partner.ids else getattr(partner, "id", None)
        self.assertIsInstance(pid, int)
        new_rec = _call_kw(1, self.db, "res.partner", "copy", [[pid]], {})
        new_id = new_rec.ids[0] if new_rec.ids else getattr(new_rec, "id", new_rec)
        self.assertIsInstance(new_id, int)
        self.assertNotEqual(new_id, pid)
        result = _call_kw(1, self.db, "res.partner", "search_read", [[["id", "=", new_id]]], {"fields": ["id", "name"]})
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "CopyTestPartner (copy)")

    def test_default_get_returns_field_defaults(self):
        """default_get returns field defaults and context overrides (Phase 69)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "crm.lead", "default_get", [["name", "type", "expected_revenue"]], {})
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("type"), "lead")
        result_ctx = _call_kw(1, self.db, "crm.lead", "default_get", [["type"]], {"context": {"default_type": "opportunity"}})
        self.assertEqual(result_ctx.get("type"), "opportunity")

    def test_onchange_country_id_clears_state_id(self):
        """onchange('country_id', vals) returns state_id=None when country changes (Phase 60)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        vals = {"name": "Test", "country_id": 1, "state_id": 5}
        result = _call_kw(1, self.db, "res.partner", "onchange", ["country_id", vals], {})
        self.assertIsInstance(result, dict)
        self.assertIn("state_id", result)
        self.assertIsNone(result["state_id"])

    def test_mail_activity_create_and_read(self):
        """mail.activity create and read via crm.lead activity_schedule (Phase 75)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "ActivityTestLead"}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)
        rec = _call_kw(1, self.db, "crm.lead", "activity_schedule", [[lead_id], "Call back", "2025-03-15", "Remind"], {})
        act_id = rec.ids[0] if rec.ids else getattr(rec, "id", None)
        self.assertIsInstance(act_id, int)
        rows = _call_kw(1, self.db, "mail.activity", "search_read", [[["id", "=", act_id]]], {
            "fields": ["id", "res_model", "res_id", "summary", "note", "date_deadline", "state"],
        })
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["res_model"], "crm.lead")
        self.assertEqual(rows[0]["res_id"], lead_id)
        self.assertEqual(rows[0]["summary"], "Call back")
        self.assertEqual(rows[0]["note"], "Remind")
        self.assertTrue(str(rows[0]["date_deadline"]).startswith("2025-03-15"))
        self.assertIn(rows[0]["state"], ("overdue", "today", "planned"))

    def test_action_button_calls_method(self):
        """action_mark_won changes stage to Won (Phase 76)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        won_stages = _call_kw(1, self.db, "crm.stage", "search_read", [[["is_won", "=", True]]], {"fields": ["id"], "limit": 1})
        if not won_stages:
            self.skipTest("No crm.stage with is_won=True in test DB")
        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "ActionTestLead", "stage_id": 1}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)
        _call_kw(1, self.db, "crm.lead", "action_mark_won", [[lead_id]], {})
        rows = _call_kw(1, self.db, "crm.lead", "search_read", [[["id", "=", lead_id]]], {"fields": ["id", "stage_id"]})
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["stage_id"], won_stages[0]["id"])

    def test_ir_filters_create_and_read(self):
        """ir.filters create and search_read returns stored model/domain (Phase 80)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        import json
        domain = [["stage_id", "=", 1]]
        rec = _call_kw(1, self.db, "ir.filters", "create", [{
            "name": "Test Filter",
            "model_id": "crm.lead",
            "domain": json.dumps(domain),
            "user_id": 1,
        }], {})
        rec_id = rec.ids[0] if rec.ids else getattr(rec, "id", None)
        self.assertIsInstance(rec_id, int)
        rows = _call_kw(1, self.db, "ir.filters", "search_read", [[["id", "=", rec_id]]], {
            "fields": ["id", "name", "model_id", "domain"],
        })
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "Test Filter")
        self.assertEqual(rows[0]["model_id"], "crm.lead")
        parsed = json.loads(rows[0]["domain"]) if isinstance(rows[0]["domain"], str) else rows[0]["domain"]
        self.assertEqual(parsed, domain)

    def test_message_post_and_read(self):
        """message_post on lead creates mail.message; message_ids returns body/author (Phase 81)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        lead = _call_kw(1, self.db, "crm.lead", "create", [{"name": "ChatterTestLead"}], {})
        lead_id = lead.ids[0] if lead.ids else getattr(lead, "id", None)
        self.assertIsInstance(lead_id, int)
        _call_kw(1, self.db, "crm.lead", "message_post", [[lead_id], "Hello from test"], {})
        rows = _call_kw(1, self.db, "crm.lead", "read", [[lead_id], ["message_ids"]], {})
        self.assertEqual(len(rows), 1)
        msg_ids = rows[0].get("message_ids", [])
        self.assertGreater(len(msg_ids), 0)
        msgs = _call_kw(1, self.db, "mail.message", "search_read", [[["id", "in", msg_ids]]], {
            "fields": ["id", "body", "author_id", "res_model", "res_id"],
        })
        self.assertGreaterEqual(len(msgs), 1)
        m = msgs[0]
        self.assertEqual(m["body"], "Hello from test")
        self.assertEqual(m["res_model"], "crm.lead")
        self.assertEqual(m["res_id"], lead_id)
        self.assertEqual(m["author_id"], 1)

    def test_read_group_aggregation(self):
        """read_group returns grouped rows with SUM and __count (Phase 84)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        result = _call_kw(1, self.db, "crm.lead", "read_group", [[]], {
            "fields": ["expected_revenue"],
            "groupby": ["stage_id"],
        })
        self.assertIsInstance(result, list)
        for row in result:
            self.assertIn("stage_id", row)
            self.assertIn("__count", row)
            self.assertIn("expected_revenue", row)
            self.assertIsInstance(row["__count"], int)

    def test_import_data_creates_records(self):
        """import_data creates records from fields and rows (Phase 86)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        import uuid
        unique = str(uuid.uuid4())[:8]
        name1, name2 = f"ImportLead_{unique}_1", f"ImportLead_{unique}_2"
        result = _call_kw(1, self.db, "crm.lead", "import_data", [["name", "type"], [[name1, "lead"], [name2, "opportunity"]]], {})
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("created"), 2)
        self.assertEqual(result.get("updated"), 0)
        self.assertEqual(len(result.get("errors", [])), 0)
        rows = _call_kw(1, self.db, "crm.lead", "search_read", [[["name", "in", [name1, name2]]]], {"fields": ["id", "name", "type"]})
        self.assertEqual(len(rows), 2)
        names = {r["name"] for r in rows}
        self.assertIn(name1, names)
        self.assertIn(name2, names)
