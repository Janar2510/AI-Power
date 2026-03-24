"""Embedding pipeline helpers (pgvector / chunk indexing). Phase 497."""

from .pipeline import (
    ensure_pgvector_extension,
    embedding_column_supported,
    embedding_column_is_pgvector_type,
)

__all__ = [
    "ensure_pgvector_extension",
    "embedding_column_supported",
    "embedding_column_is_pgvector_type",
]
