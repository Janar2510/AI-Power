"""Phase 171: Field Change Tracking (Audit Trail)."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestTrackingPhase171(unittest.TestCase):
    """Phase 171: tracked field changes create mail.message in chatter."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_tracked_field_change_creates_chatter_message(self):
        """Writing a tracked field on crm.lead creates mail.message with change log."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            load_default_data(Environment(registry, cr=cr, uid=1))
            cr.connection.commit()
            env = Environment(registry, cr=cr, uid=1)
            CrmLead = env.get("crm.lead")
            CrmStage = env.get("crm.stage")
            MailMessage = env.get("mail.message")
            if not CrmLead or not MailMessage:
                self.skipTest("crm.lead or mail.message not loaded")
            stages = CrmStage.search_read([], ["id", "name"], limit=2)
            if len(stages) < 2:
                self.skipTest("Need at least 2 crm.stage records")
            lead = CrmLead.create({
                "name": "Track Test Lead",
                "stage_id": stages[0]["id"],
            })
            lead_id = lead.id if hasattr(lead, "id") else (lead.ids[0] if lead.ids else None)
            self.assertIsNotNone(lead_id)
            # Use recordset with env for write (browse uses registry._env)
            rec = CrmLead(env, [lead_id])
            before = MailMessage.search_count([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)])
            rec.write({"stage_id": stages[1]["id"]})
            after = MailMessage.search_count([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)])
            self.assertGreater(after, before, "Writing tracked stage_id should create chatter message")

    def test_message_post_creates_mail_message(self):
        """Sanity: message_post on crm.lead creates a mail.message record."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            load_default_data(Environment(registry, cr=cr, uid=1))
            cr.connection.commit()
            env = Environment(registry, cr=cr, uid=1)
            CrmLead = env.get("crm.lead")
            MailMessage = env.get("mail.message")
            if not CrmLead or not MailMessage:
                self.skipTest("crm.lead or mail.message not loaded")
            lead = CrmLead.create({"name": "Msg Test Lead"})
            lead_id = lead.id if hasattr(lead, "id") else (lead.ids[0] if lead.ids else None)
            self.assertIsNotNone(lead_id)
            rec = CrmLead(env, [lead_id])
            rec.message_post(body="Test note", message_type="note")
            count = MailMessage.search_count([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)])
            self.assertGreater(count, 0, "message_post should create mail.message")

    def test_field_has_tracking_parameter(self):
        """Field base class supports tracking=True."""
        from core.orm import fields
        f = fields.Char(tracking=True)
        self.assertTrue(getattr(f, "tracking", False))
        g = fields.Char()
        self.assertFalse(getattr(g, "tracking", True))
