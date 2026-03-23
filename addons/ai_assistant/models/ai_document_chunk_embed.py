"""Refresh ai.document.chunk.embedding when text changes (Phase 527 pipeline)."""

from __future__ import annotations

from core.orm import Model
from core.orm.models import ModelBase


class AiDocumentChunkEmbed(Model):
    _inherit = "ai.document.chunk"

    # Note: do not override `create` here — merged `_inherit` classes share the base
    # registry class; `super()` in a copied classmethod breaks. New rows: use
    # `index_record_for_rag` or create then `write({"text": ...})`.

    def write(self, vals):
        # Registry merge copies this method onto the base model; `super()` breaks because
        # `self` is the base model instance, not a Python subclass of this extension.
        res = ModelBase.write(self, vals)
        if res and "text" in vals and "embedding" not in vals:
            self._ai_chunk_refresh_embedding_for_vals(vals)
        return res

    def _ai_chunk_refresh_embedding_for_vals(self, vals: dict) -> None:
        """Embed using the new text from vals (post-commit read can lag in some harnesses)."""
        from ..tools.registry import _get_embedding

        env = getattr(self, "env", None)
        if not env:
            return
        text = (vals.get("text") or "").strip()
        if not text:
            return
        emb = _get_embedding(env, text)
        if emb is not None:
            ModelBase.write(self, {"embedding": emb})
