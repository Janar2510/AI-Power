"""Phase 172: Incoming Email to Chatter (Reply Routing)."""

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


class TestEmailRoutingPhase172(unittest.TestCase):
    """Phase 172: In-Reply-To routes incoming email to chatter."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_mail_message_has_message_id_field(self):
        """mail.message has message_id field for reply routing."""
        if not self._has_db:
            self.skipTest("DB not found")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            MailMessage = env.get("mail.message")
            if not MailMessage:
                self.skipTest("mail.message not loaded")
            fields = MailMessage.fields_get()
            self.assertIn("message_id", fields)

    def test_message_post_stores_message_id(self):
        """message_post creates mail.message with message_id."""
        if not self._has_db:
            self.skipTest("DB not found")
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
            lead = CrmLead.create({"name": "Reply Test Lead"})
            lead_id = lead.id if hasattr(lead, "id") else (lead.ids[0] if lead.ids else None)
            self.assertIsNotNone(lead_id)
            rec = CrmLead(env, [lead_id])
            rec.message_post(body="Original", message_type="comment")
            msgs = MailMessage.search_read(
                [("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)],
                ["message_id"],
            )
            self.assertGreater(len(msgs), 0)
            self.assertTrue(
                msgs[0].get("message_id", "").startswith("<"),
                "message_id should be in angle-bracket format",
            )
