"""Image helpers (Phase 404)."""

import base64
from io import BytesIO
from typing import Optional


def base64_to_image(data: str) -> bytes:
    return base64.b64decode(data)


def image_to_base64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def image_process(raw: bytes, _width: Optional[int] = None, _height: Optional[int] = None) -> bytes:
    """Pass-through placeholder for resizing/cropping hooks."""
    buf = BytesIO()
    buf.write(raw)
    return buf.getvalue()
