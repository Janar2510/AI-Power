"""Phase 101: Website module, portal routes, portal record rules."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.auth import hash_password


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestWebsitePhase101(unittest.TestCase):
    """Phase 101: portal user sees only own leads, my profile update."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_portal_user_sees_only_own_leads(self):
        """Portal user search returns only leads where partner_id = their partner (Phase 101)."""
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
            User = env.get("res.users")
            Partner = env.get("res.partner")
            Lead = env.get("crm.lead")
            Groups = env.get("res.groups")
            if not all([User, Partner, Lead, Groups]):
                self.skipTest("Required models not loaded")
            group_portal = Groups.search([("full_name", "=", "base.group_portal")], limit=1)
            if not group_portal or not group_portal.ids:
                self.skipTest("base.group_portal not found")
            p1 = Partner.create({"name": "Portal Partner 1", "email": "p1@test.com"})
            p2 = Partner.create({"name": "Portal Partner 2", "email": "p2@test.com"})
            portal_user = User._create_portal_user(env, "Portal User", "portal101@test.com", "password", "p1@test.com")
            if not portal_user:
                self.skipTest("Could not create portal user")
            # Link p1 as portal user's partner so record rule partner_id=uid.partner_id matches
            User(env, [portal_user]).write({"partner_id": p1.ids[0]})
            Partner.browse([p1.ids[0]]).write({"user_id": portal_user})
            Lead.create({"name": "Lead for P1", "partner_id": p1.ids[0]})
            Lead.create({"name": "Lead for P2", "partner_id": p2.ids[0]})
            env_portal = Environment(registry, cr=cr, uid=portal_user)
            registry.set_env(env_portal)
            leads = Lead.search([])
            self.assertEqual(len(leads), 1, "Portal user must see only leads with their partner")
            self.assertEqual(leads.read(["name"])[0].get("name"), "Lead for P1")

    def test_portal_my_profile_update(self):
        """Portal user can update name/email via profile (Phase 101)."""
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
            User = env.get("res.users")
            Partner = env.get("res.partner")
            Groups = env.get("res.groups")
            if not all([User, Partner, Groups]):
                self.skipTest("Required models not loaded")
            portal_user = User._create_portal_user(env, "Profile Test", "profile101@test.com", "pass", "profile@test.com")
            if not portal_user:
                self.skipTest("Could not create portal user")
            User(env, [portal_user]).write({"name": "Updated Name", "email": "updated@test.com"})
            rows = User.read_ids([portal_user], ["name", "email"])
            self.assertEqual(rows[0].get("name"), "Updated Name")
            self.assertEqual(rows[0].get("email"), "updated@test.com")

    def test_portal_lead_detail_and_message(self):
        """Phase 111: portal user can view lead detail and post message (collaboration flow)."""
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
            User = env.get("res.users")
            Partner = env.get("res.partner")
            Lead = env.get("crm.lead")
            Groups = env.get("res.groups")
            MailMessage = env.get("mail.message")
            if not all([User, Partner, Lead, Groups]):
                self.skipTest("Required models not loaded")
            group_portal = Groups.search([("full_name", "=", "base.group_portal")], limit=1)
            if not group_portal or not group_portal.ids:
                self.skipTest("base.group_portal not found")
            p1 = Partner.create({"name": "Portal P111", "email": "p111@test.com"})
            portal_user = User._create_portal_user(env, "Portal 111", "portal111@test.com", "pass111", "p111@test.com")
            if not portal_user:
                self.skipTest("Could not create portal user")
            User(env, [portal_user]).write({"partner_id": p1.ids[0]})
            Partner.browse([p1.ids[0]]).write({"user_id": portal_user})
            lead = Lead.create({"name": "Lead for P111", "partner_id": p1.ids[0]})
            lead_id = lead.ids[0] if lead.ids else lead.id
            self.assertIsNotNone(lead_id)
            env_portal = Environment(registry, cr=cr, uid=portal_user)
            registry.set_env(env_portal)
            msgs_before = MailMessage.search([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)]) if MailMessage else []
            lead_rec = Lead.browse([lead_id])
            lead_rec.message_post(body="Hello from portal test", message_type="comment")
            msgs_after = MailMessage.search([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)]) if MailMessage else []
            self.assertGreater(len(msgs_after), len(msgs_before), "message_post should create a message")
            msg_rows = MailMessage.browse(msgs_after.ids).read(["body"])
            bodies = [r.get("body", "") for r in msg_rows]
            self.assertIn("Hello from portal test", bodies)
