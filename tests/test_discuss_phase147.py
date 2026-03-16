"""Phase 147: Discuss module - mail.channel, mail.channel.member, real-time chat."""

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


class TestDiscussPhase147(unittest.TestCase):
    """Test mail.channel and discuss functionality."""

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

    def test_mail_channel_create_and_post(self):
        """Create channel, add member, post message."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Channel = env.get("mail.channel")
        Member = env.get("mail.channel.member")
        Message = env.get("mail.message")
        if not Channel or not Member or not Message:
            self.skipTest("mail.channel not loaded")
        channel = Channel.create({"name": "Test Channel", "channel_type": "channel"})
        self.assertIsNotNone(channel)
        cid = channel.ids[0] if channel.ids else channel.id
        Member.create({"channel_id": cid, "user_id": 1})
        msg = channel.message_post(body="Hello world")
        self.assertIsNotNone(msg)
        mid = msg.ids[0] if msg.ids else msg.id
        domain = [("res_model", "=", "mail.channel"), ("res_id", "=", cid)]
        msgs = Message.search_read(domain, fields=["id", "body", "author_id"])
        self.assertGreaterEqual(len(msgs), 1)
        bodies = [m.get("body") for m in msgs]
        self.assertIn("Hello world", bodies)
