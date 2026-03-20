"""Image helpers (Phase 404)."""

import base64
from io import BytesIO
from typing import Optional


def base64_to_image(data: str) -> bytes:
    return base64.b64decode(data)


def image_to_base64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def image_process(
    raw: bytes,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: int = 85,
) -> bytes:
    """Resize (max bounds) and re-encode with Pillow when available (Phase 420)."""
    if not raw:
        return raw
    if width is None and height is None:
        return raw
    try:
        from PIL import Image  # type: ignore
    except ImportError:
        buf = BytesIO()
        buf.write(raw)
        return buf.getvalue()
    try:
        im = Image.open(BytesIO(raw))
        im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
        w, h = im.size
        max_w = width or w
        max_h = height or h
        im.thumbnail((max_w, max_h), Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else 1)
        out = BytesIO()
        im.save(out, format="JPEG", quality=quality)
        return out.getvalue()
    except Exception:
        buf = BytesIO()
        buf.write(raw)
        return buf.getvalue()
