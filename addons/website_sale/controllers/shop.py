"""Phase 216: E-commerce with AI recommendations. Extends /shop with Recommended for you."""

import json
from werkzeug.wrappers import Response

from core.http.controller import route
from core.http.auth import get_session_db, _get_registry
from core.sql_db import get_cursor


def _get_recommended_products(env, limit=5):
    """Get recommended products via suggest_products tool."""
    try:
        from addons.ai_assistant.tools.registry import execute_tool
        return execute_tool(env, "suggest_products", limit=limit)
    except Exception:
        return []


@route("/shop", auth="public", methods=["GET"])
def shop_with_recommendations(request):
    """Shop with AI Recommended for you section. Overrides website /shop when website_sale installed."""
    from addons.website.controllers.website import shop_index
    resp = shop_index(request)
    if resp.status_code != 200:
        return resp
    body = resp.get_data(as_text=True)
    db = get_session_db(request)
    if not db:
        return resp
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            recs = _get_recommended_products(env, 5)
        if recs:
            rec_html = '<h2 style="margin-top:2rem">Recommended for you</h2><div class="product-grid">'
            for r in recs:
                name = (r.get("name") or "").replace("<", "&lt;")
                price = r.get("list_price", 0)
                price_str = f"{price:,.2f}" if price is not None else "0.00"
                pid = r.get("id", "")
                rec_html += f'<a href="/shop/product/{pid}" class="product-card"><div class="name">{name}</div><div class="price">{price_str}</div></a>'
            rec_html += "</div>"
            body = body.replace("</body>", rec_html + "\n</body>")
            resp.set_data(body)
    except Exception:
        pass
    return resp


@route("/shop/ai-recommendations", auth="public", methods=["GET"])
def shop_ai_recommendations(request):
    """Return recommended products JSON. Phase 216."""
    db = get_session_db(request)
    if not db:
        return Response(json.dumps({"products": []}), content_type="application/json")
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            result = _get_recommended_products(env, 5)
    except Exception:
        result = []
    products = result if isinstance(result, list) else []
    return Response(json.dumps({"products": products}), content_type="application/json")
