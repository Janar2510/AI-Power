"""Phase 528: ai.document.chunk embedding refresh on text write (mocked API)."""

import unittest
from unittest.mock import patch

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


class TestAiChunkEmbedPhase528(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_write_text_refreshes_embedding(self):
        """Patch _get_embedding only after load_module_graph (patching during load breaks imports)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
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
            Chunk = env["ai.document.chunk"]
            row = Chunk.create(
                {
                    "model": "res.partner",
                    "res_id": 1,
                    "text": "seed",
                }
            )
            with patch("addons.ai_assistant.tools.registry._get_embedding") as mock_emb:
                mock_emb.return_value = [0.01] * 1536
                Chunk.browse(row.id).write({"text": "hello world"})
                self.assertTrue(mock_emb.called)
                data = Chunk.browse(row.id).read(["embedding"])[0]
                emb = data.get("embedding")
                if emb is None:
                    self.skipTest("Vector column not available in this DB")
                # pgvector may return str, list, or buffer depending on driver
                ln = len(emb) if hasattr(emb, "__len__") else 0
                self.assertGreaterEqual(ln, 1536, msg=f"unexpected embedding payload type/len: {type(emb)} {ln}")
                mock_emb.reset_mock()
                Chunk.browse(row.id).write({"text": "updated copy"})
                self.assertTrue(mock_emb.called)
                data2 = Chunk.browse(row.id).read(["embedding"])[0]
                self.assertIsNotNone(data2.get("embedding"))
