"""Phone blacklist - avoid sending to unwanted numbers."""

import re

from core.orm import Model, fields


def _sanitize_phone(number: str) -> str:
    """Strip non-digits except leading + for E164-like storage."""
    if not number or not isinstance(number, str):
        return ""
    digits = re.sub(r"[^\d+]", "", number)
    if number.strip().startswith("+"):
        return "+" + digits.lstrip("+") if digits else ""
    return digits or ""


class PhoneBlacklist(Model):
    """Blacklist of phone numbers."""

    _name = "phone.blacklist"
    _description = "Phone Blacklist"
    _rec_name = "number"

    number = fields.Char(string="Phone Number", required=True)
    active = fields.Boolean(default=True)
