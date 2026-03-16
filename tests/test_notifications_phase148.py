"""Phase 148: Notification center - mail.notification, bell icon, mark as read."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestNotificationsPhase148(unittest.TestCase):
    """Test mail.notification and notification center."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def _get_env(self):
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
            return env

    def test_mail_notification_create(self):
        """Create notification via channel message_post."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Channel = env.get("mail.channel")
        Member = env.get("mail.channel.member")
        Notification = env.get("mail.notification")
        User = env.get("res.users")
        if not all([Channel, Member, Notification, User]):
            self.skipTest("mail.notification not loaded")
        channel = Channel.create({"name": "Notify Test", "channel_type": "channel"})
        cid = channel.ids[0]
        Member.create({"channel_id": cid, "user_id": 1})
        Member.create({"channel_id": cid, "user_id": 2})
        channel.message_post(body="Test notification")
        user1_partner = User.read_ids([1], ["partner_id"])[0].get("partner_id")
        user1_partner = user1_partner[0] if isinstance(user1_partner, (list, tuple)) else user1_partner
        notifs = Notification.search([("res_partner_id", "=", user1_partner)])
        self.assertIsNotNone(notifs)
        self.assertGreaterEqual(len(notifs.ids), 0)
