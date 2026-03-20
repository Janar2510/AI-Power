"""Mail utility helpers (Phase 404)."""

import re
from html import unescape
from typing import List


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def email_split(value: str) -> List[str]:
    return EMAIL_RE.findall(value or "")


def email_normalize(value: str) -> str:
    return (value or "").strip().lower()


def html2plaintext(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", unescape(text)).strip()


def plaintext2html(value: str) -> str:
    return "<p>" + (value or "").replace("&", "&amp;").replace("<", "&lt;").replace("\n", "<br/>") + "</p>"
