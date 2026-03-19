"""Extend res.partner with IAP-based company autocomplete."""

from core.orm import Model


class ResPartnerAutocomplete(Model):
    _inherit = "res.partner"

    def autocomplete_by_name(self, query, query_country_id=False, timeout=15):
        """Search companies by name via IAP. Stub: returns empty list."""
        return []

    def autocomplete_by_domain(self, domain, query_country_id=False, timeout=15):
        """Search companies by domain via IAP. Stub: returns empty list."""
        return []
