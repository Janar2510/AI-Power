"""Extend res.users with phone validation helpers."""

import re

from core.orm import Model


class ResUsersPhoneValidation(Model):
    _inherit = "res.users"

    def _phone_format(self, fname=None, number=None, country=None, force_format="E164", raise_exception=False):
        """Format phone number. Stub: returns number sanitized for E164-like storage."""
        if number is not None:
            return self._phone_sanitize(str(number))
        if not self.ids:
            return False
        self.ensure_one()
        for fn in ("mobile", "phone"):
            if hasattr(self._model, fn):
                try:
                    val = self.read([fn])[0].get(fn) if self.read([fn]) else None
                    if val:
                        return self._phone_sanitize(str(val))
                except Exception:
                    pass
        return False

    def _phone_sanitize(self, number):
        """Sanitize phone for storage/search."""
        if not number or not isinstance(number, str):
            return ""
        digits = re.sub(r"[^\d+]", "", number)
        if number.strip().startswith("+"):
            return "+" + digits.lstrip("+") if digits else ""
        return digits or ""
