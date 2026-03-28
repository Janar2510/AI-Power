"""RAG indexing text helpers (Phase C1) — import-safe (no controller side effects)."""

# Long-record indexing keeps a single chunk row; trim with overlap tail for embedding stability.
RAG_INDEX_MAX_CHARS = 8000
RAG_INDEX_OVERLAP_TAIL = 200


def normalize_rag_index_text(text: str) -> str:
    t = (text or "").strip()
    if len(t) <= RAG_INDEX_MAX_CHARS:
        return t
    keep_head = RAG_INDEX_MAX_CHARS - RAG_INDEX_OVERLAP_TAIL
    return t[:keep_head] + "\n…\n" + t[-RAG_INDEX_OVERLAP_TAIL:]
