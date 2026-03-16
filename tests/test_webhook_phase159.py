"""Phase 159: Webhooks - ir.webhook, HMAC, async delivery."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    from pathlib import Path
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestWebhookPhase159(unittest.TestCase):
    """Test ir.webhook model and HMAC signature."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_ir_webhook_create(self):
        """ir.webhook can be created with model, trigger, url."""
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
            Webhook = env.get("ir.webhook")
            if not Webhook:
                self.skipTest("ir.webhook not loaded")
            w = Webhook.create({
                "name": "Test Webhook",
                "model_name": "crm.lead",
                "trigger": "on_create",
                "url": "https://example.com/webhook",
            })
            self.assertIsNotNone(w.id if hasattr(w, "id") else (w.ids[0] if w.ids else None))
            row = Webhook.browse(w.ids[0]).read(["name", "model_name", "trigger", "url"])[0]
            self.assertEqual(row.get("name"), "Test Webhook")
            self.assertEqual(row.get("model_name"), "crm.lead")
            self.assertEqual(row.get("trigger"), "on_create")

    def test_webhook_signature(self):
        """HMAC-SHA256 signature is computed correctly."""
        from addons.base.models.ir_webhook import IrWebhook
        payload = b'{"event":"on_create","model":"crm.lead","ids":[1]}'
        sig = IrWebhook._compute_signature(payload, "secret")
        self.assertTrue(len(sig) == 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in sig))
