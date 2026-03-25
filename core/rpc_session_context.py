"""Session → ORM context merge for JSON-RPC call_kw (Phase 617). Standalone for lightweight unit tests."""

from typing import Any, Dict, List, Optional


def merge_session_into_rpc_context(
    method_kwargs: Dict[str, Any],
    company_id: Optional[int],
    allowed_company_ids: List[int],
) -> Dict[str, Any]:
    """Pop ``context`` from ``method_kwargs`` and merge session company / allowed companies."""
    env_context = dict(method_kwargs.pop("context", {}) or {})
    if company_id and "company_id" not in env_context:
        env_context["company_id"] = company_id
    if allowed_company_ids and "allowed_company_ids" not in env_context:
        env_context["allowed_company_ids"] = list(allowed_company_ids)
    return env_context
