"""Barcode scan API (Phase 229)."""

import re
from typing import Any, Dict, Optional

from core.http.controller import route
from core.http.request import Request


def _parse_barcode(raw: str) -> Optional[str]:
    """Parse barcode: EAN-13 (13 digits), EAN-8 (8 digits), Code-128 (alphanumeric)."""
    if not raw or not str(raw).strip():
        return None
    s = str(raw).strip()
    if re.match(r"^\d{13}$", s):
        return s
    if re.match(r"^\d{8}$", s):
        return s
    if re.match(r"^[A-Za-z0-9\-]+$", s) and len(s) <= 48:
        return s
    return s


@route("/barcode/scan", methods=["POST"], auth="user")
def barcode_scan(request: Request) -> Dict[str, Any]:
    """
    Scan barcode. POST body: {barcode, mode?, picking_id?}.
    mode: receive|pick|transfer.
    Returns {product_id, product_name, barcode, matched, error?}.
    """
    try:
        body = request.get_json(silent=True) or {}
    except Exception:
        body = {}
    barcode_raw = body.get("barcode", "")
    mode = body.get("mode", "pick")
    picking_id = body.get("picking_id")
    parsed = _parse_barcode(barcode_raw)
    if not parsed:
        return {"matched": False, "error": "Invalid barcode"}
    env = request.env
    Product = env.get("product.product")
    if not Product:
        return {"matched": False, "error": "product.product not found"}
    products = Product.search_read([("barcode", "=", parsed)], ["id", "name", "barcode"], limit=1)
    if not products:
        products = Product.search_read([("barcode", "ilike", parsed)], ["id", "name", "barcode"], limit=1)
    if not products:
        return {"matched": False, "barcode": parsed, "product_id": None, "product_name": None}
    p = products[0]
    pid = p.get("id")
    return {
        "matched": True,
        "barcode": parsed,
        "product_id": pid,
        "product_name": p.get("name"),
    }


@route("/barcode/parse", methods=["GET"], auth="user")
def barcode_parse(request: Request) -> Dict[str, Any]:
    """Parse barcode format. GET ?barcode=xxx."""
    barcode_raw = (request.args or {}).get("barcode", "")
    parsed = _parse_barcode(barcode_raw)
    return {"valid": parsed is not None, "parsed": parsed or ""}
