"""RAG bulk reindex - cron-callable for ai.document.chunk population (Phase 114)."""

import logging

from core.orm import Model

_logger = logging.getLogger("erp.ai_assistant")


class AiRagReindex(Model):
    """Cron hook for bulk RAG reindex. Indexes res.partner and crm.lead into ai.document.chunk."""

    _name = "ai.rag.reindex"
    _description = "RAG Bulk Reindex"

    @classmethod
    def run(cls) -> int:
        """Cron entrypoint: reindex all partners and leads. Returns count of records indexed."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        try:
            from addons.ai_assistant.tools.registry import index_record_for_rag
        except ImportError:
            _logger.warning("index_record_for_rag not available")
            return 0
        count = 0
        for model in ("res.partner", "crm.lead"):
            M = env.get(model)
            if not M:
                continue
            try:
                ids = M.search([]).ids
                for rid in ids[:500]:  # limit per run to avoid long cron
                    try:
                        index_record_for_rag(env, model, rid)
                        count += 1
                    except Exception:
                        pass
            except Exception as e:
                _logger.warning("RAG reindex %s failed: %s", model, e)
        return count
