"""Extend res.partner with local + optional IAP autocomplete (Phase 420)."""

from typing import Any, List

from core.orm import Model


class ResPartnerAutocomplete(Model):
    _inherit = "res.partner"

    @classmethod
    def autocomplete_by_name(
        cls,
        query: str,
        query_country_id: bool = False,
        timeout: int = 15,
    ) -> List[Any]:
        """Ranked name_search on res.partner (IAP hook reserved)."""
        _ = query_country_id, timeout
        q = (query or "").strip()
        if not q:
            return []
        return cls.name_search(q, [], "ilike", 12)

    @classmethod
    def autocomplete_by_domain(
        cls,
        domain: str,
        query_country_id: bool = False,
        timeout: int = 15,
    ) -> List[Any]:
        """Match partners by website or email domain."""
        _ = query_country_id, timeout
        d = (domain or "").strip().lower()
        if not d:
            return []
        return cls.name_search(d, ["|", ("website", "ilike", d), ("email", "ilike", "%" + d + "%")], "ilike", 12)
