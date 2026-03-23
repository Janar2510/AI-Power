"""Optional pgvector bootstrap and feature detection for semantic RAG.

**Indexing pipeline (Phase 528)**

- **Explicit index:** `tools.registry.index_record_for_rag(env, model, res_id)` builds text from
  configured fields, calls OpenAI `text-embedding-3-small` when `OPENAI_API_KEY` (via `_get_api_key`),
  and upserts `ai.document.chunk` (model, res_id, text, embedding).
- **Chunk rows:** `ai.document.chunk` `_inherit` (`ai_document_chunk_embed`) refreshes `embedding`
  on `write` when `text` changes and `embedding` is not in the same write — same API key requirement.
  (Initial embed for new rows: use `index_record_for_rag` or a follow-up `write` on `text`.)
- **Cron bulk index:** `ai.rag.reindex.run()` indexes `res.partner`, `crm.lead`, and `knowledge.article` (when modules loaded), capped per run.
- **Retrieval:** `retrieve_chunks` in `tools/registry.py` prefers vector distance when
  `ai.document.chunk.embedding` is populated and PostgreSQL supports the `<=>` operator (pgvector).

**DBA:** run `ensure_pgvector_extension(cr)` after migrations on databases that should use vectors;
use `embedding_column_supported(cr)` in diagnostics. Without the extension, chunks still store
text and retrieval falls back to ILIKE.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

_logger = logging.getLogger("erp.ai.embeddings")


def ensure_pgvector_extension(cr: Any) -> bool:
    """Run CREATE EXTENSION IF NOT EXISTS vector. Returns False on failure."""
    if cr is None:
        return False
    try:
        cr.execute("CREATE EXTENSION IF NOT EXISTS vector")
        return True
    except Exception as e:
        _logger.info("pgvector extension not available: %s", e)
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
