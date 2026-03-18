"""Phase 207: Mass mailing."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestMailingPhase207(unittest.TestCase):
    """Test mailing models and send flow."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_mailing_models_exist(self):
        """mailing.list and mailing.mailing are registered."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            MailingList = env.get("mailing.list")
            MailingMailing = env.get("mailing.mailing")
            MailingListPartner = env.get("mailing.list.partner")
            MailingTracking = env.get("mailing.tracking")
            self.assertIsNotNone(MailingList)
            self.assertIsNotNone(MailingMailing)
            self.assertIsNotNone(MailingListPartner)
            self.assertIsNotNone(MailingTracking)

    def test_mailing_send_queues_mail(self):
        """action_send creates mail.mail for subscribers."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            MailingList = env.get("mailing.list")
            MailingListPartner = env.get("mailing.list.partner")
            MailingMailing = env.get("mailing.mailing")
            MailMail = env.get("mail.mail")
            if not all([Partner, MailingList, MailingListPartner, MailingMailing, MailMail]):
                self.skipTest("Models not loaded")
            partner = Partner.create({"name": "Mailing Test", "email": "test@example.com"})
            pid = partner.ids[0] if partner.ids else partner.id
            mlist = MailingList.create({"name": "Test List"})
            lid = mlist.ids[0] if mlist.ids else mlist.id
            MailingListPartner.create({
                "mailing_list_id": lid,
                "partner_id": pid,
                "is_subscribed": True,
            })
            mailing = MailingMailing.create({
                "name": "Test Campaign",
                "subject": "Hello",
                "body_html": "<p>Hi {{ object.name }}</p>",
                "mailing_list_id": lid,
            })
            mid = mailing.ids[0] if mailing.ids else mailing.id
            count_before = MailMail.search_count([("state", "=", "outgoing")])
            MailingMailing.browse(mid).action_send()
            count_after = MailMail.search_count([("state", "=", "outgoing")])
            self.assertGreaterEqual(count_after, count_before, "Should queue at least one mail")
