"""Phase 532: retrieve_chunks ilike fallback when embedding API unavailable."""

import unittest
from unittest.mock import patch
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase


class TestAiRetrieveChunksPhase532(unittest.TestCase):
    db = "_test_rpc_read"
    _addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=" + cls._addons_path])
        cls._has_db = db_exists(cls.db)

    def test_retrieve_chunks_ilike_without_embedding(self):
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Chunk = env.get("ai.document.chunk")
            Partner = env.get("res.partner")
            if not Chunk or not Partner:
                self.skipTest("models missing")
            uniq = "retrieve532-" + str(id(self))
            p = Partner.create({"name": uniq + " partner"})
            pid = p.ids[0]
            row = Chunk.create(
                {"model": "res.partner", "res_id": pid, "text": uniq + " hello world"}
            )
            cid = row.id if hasattr(row, "id") else row.ids[0]
            from addons.ai_assistant.tools import registry as reg

            with patch.object(reg, "_get_embedding", return_value=None):
                out = reg.retrieve_chunks(env, uniq, limit=5)
            self.assertTrue(any(uniq in (x.get("text") or "") for x in out), out)
            Chunk.browse(cid).unlink()
            Partner.browse(pid).unlink()
