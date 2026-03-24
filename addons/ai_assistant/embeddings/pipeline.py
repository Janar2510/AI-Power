"""Optional pgvector bootstrap and feature detection for semantic RAG.

**Indexing pipeline (Phase 528)**

- **Explicit index:** `tools.registry.index_record_for_rag(env, model, res_id)` builds text from
  configured fields, calls OpenAI `text-embedding-3-small` when `OPENAI_API_KEY` (via `_get_api_key`),
  and upserts `ai.document.chunk` (model, res_id, text, embedding).
- **Chunk rows:** `ai.document.chunk` `_inherit` (`ai_document_chunk_embed`) refreshes `embedding`
  on `write` when `text` changes and `embedding` is not in the same write — same API key requirement.
  (Initial embed for new rows: use `index_record_for_rag` or a follow-up `write` on `text`.)
- **Cron bulk index:** `ai.rag.reindex.run()` indexes `res.partner`, `crm.lead`, and `knowledge.article` (when modules loaded), capped per run.
- **Retrieval:** `retrieve_chunks` in `tools/registry.py` uses `<=>` only when the ``embedding``
  column is native **pgvector** (see `embedding_column_is_pgvector_type`). If the DB was initialized
  without the extension, the column is **JSONB** and retrieval uses ILIKE (Phase 547).

**DBA / Phase 547:** After `CREATE EXTENSION vector` on a DB that used JSONB embeddings, re-run
`db init` on a fresh database **or** migrate the column type and re-index chunks (re-embed).
`ensure_pgvector_extension(cr)` is safe to call from maintenance scripts; `embedding_column_supported(cr)`
probes the `<=>` operator; `embedding_column_is_pgvector_type(cr, table, column)` inspects
``information_schema`` for ``udt_name = vector``.

**Phase 552 — JSONB to native vector (manual migration path)**

1. Install pgvector on the **same** PostgreSQL major as your server (e.g. Homebrew `pgvector` for `postgresql@15`).
2. In the target database: ``CREATE EXTENSION IF NOT EXISTS vector;`` (superuser or allowed role).
3. Inspect current type: ``SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_document_chunk' AND column_name = 'embedding';`` — expect ``jsonb`` if init ran without the extension.
4. **Preferred for production:** new DB from ``db init`` with extension present, then restore business data / re-index RAG.
5. **In-place (expert only):** altering ``jsonb`` to ``vector(n)`` is not a direct cast; typical approaches are add a new ``vector`` column, backfill via application re-embed (``index_record_for_rag`` / chunk ``write`` on ``text``), swap columns behind maintenance window, or truncate chunks and bulk ``ai.rag.reindex``. Do **not** run destructive SQL without backup.
6. After the column is ``vector``, run chunk re-indexing so rows hold proper embeddings (cron ``ai.rag.reindex`` or tooling in ``tools.registry``). Verify with ``scripts/check_embedding_column.py``.
7. JSONB-only databases remain supported: ``retrieve_chunks`` never sends ``<=>`` unless ``embedding_column_is_pgvector_type`` is true (Phase 547).
"""

from __future__ import annotations

import logging
from typing import Any, Optional

_logger = logging.getLogger("erp.ai.embeddings")


def ensure_pgvector_extension(cr: Any) -> bool:
    """Run CREATE EXTENSION IF NOT EXISTS vector. Returns False on failure.

    Uses a SAVEPOINT so a missing extension does not abort the outer transaction.
    """
    if cr is None:
        return False
    import time

    from psycopg2 import sql

    sp = f"erp_ai_pgvector_{int(time.time() * 1000000)}"
    try:
        cr.execute(sql.SQL("SAVEPOINT {}").format(sql.Identifier(sp)))
        cr.execute("CREATE EXTENSION IF NOT EXISTS vector")
        cr.execute(sql.SQL("RELEASE SAVEPOINT {}").format(sql.Identifier(sp)))
        return True
    except Exception as e:
        _logger.info("pgvector extension not available: %s", e)
        try:
            cr.execute(sql.SQL("ROLLBACK TO SAVEPOINT {}").format(sql.Identifier(sp)))
        except Exception:
            pass
        return False


def embedding_column_supported(cr: Any) -> Optional[bool]:
    """Return True if a test vector query works, False if not, None if unknown."""
    if cr is None:
        return None
    try:
        cr.execute("SELECT '[1,0,0]'::vector <=> '[0,1,0]'::vector AS d")
        cr.fetchone()
        return True
    except Exception:
        return False


def embedding_column_is_pgvector_type(
    cr: Any, table: str = "ai_document_chunk", column: str = "embedding"
) -> bool:
    """True if ``public.table.column`` is native pgvector (Phase 547).

    When pgvector was missing at ``init_schema``, the ORM creates ``embedding`` as JSONB;
    ``<=>`` queries must not run in that case.
    """
    if cr is None:
        return False
    try:
        cr.execute(
            """
            SELECT udt_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s AND column_name = %s
            """,
            (table, column),
        )
        row = cr.fetchone()
        if not row:
            return False
        udt = row["udt_name"] if hasattr(row, "keys") else row[0]
        return str(udt).lower() == "vector"
    except Exception:
        return False
