"""Website and portal controllers (Phase 101)."""

import html
import json
import base64

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
from core.http.session import ensure_session_csrf
from core.sql_db import get_cursor


WEBSITE_HOME_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ERP Platform</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }
  .hero { max-width: 600px; margin: 4rem auto; padding: 2rem; text-align: center; }
  .hero h1 { margin-top: 0; }
  .hero a { display: inline-block; margin: 0.5rem; padding: 0.75rem 1.5rem; background: #1a1a2e; color: white; text-decoration: none; border-radius: 4px; }
</style>
</head>
<body>
<div class="hero">
  <h1>Welcome</h1>
  <p>ERP Platform - Manage your business.</p>
  <a href="/shop">Shop</a>
  <a href="/web/login">Log in</a>
  <a href="/web/signup">Create account</a>
</div>
</body>
</html>"""


PORTAL_MY_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>My Portal</title>
<link rel="stylesheet" href="/web/static/src/scss/webclient.css"/>
<style>
  body {{ margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }}
  .portal-nav {{ background: #1a1a2e; color: white; padding: 1rem 2rem; display: flex; gap: 1rem; align-items: center; }}
  .portal-nav a {{ color: white; text-decoration: none; }}
  .portal-content {{ max-width: 800px; margin: 2rem auto; padding: 0 1rem; }}
  .portal-content h1 {{ margin-top: 0; }}
  table {{ width: 100%; border-collapse: collapse; background: white; }}
  th, td {{ padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #eee; }}
  th {{ background: #f8f8f8; }}
  .btn {{ display: inline-block; padding: 0.5rem 1rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }}
</style>
</head>
<body>
<div class="portal-nav">
  <a href="/my">Dashboard</a>
  <a href="/my/leads">My Leads</a>
  <a href="/my/orders">My Orders</a>
  <a href="/my/invoices">My Invoices</a>
  <a href="/my/calendar">My Calendar</a>
  <a href="/my/profile">My Profile</a>
  <a href="/web/logout">Logout</a>
</div>
<div class="portal-content">
  {content}
</div>
</body>
</html>"""


def _require_portal_session(request):
    """Require valid session. Returns (uid, db) or (None, None)."""
    uid = get_session_uid(request)
    if uid is None:
        return None, None
    return uid, get_session_db(request)


def _is_portal_user(registry, db, uid):
    """Check if user has base.group_portal (portal user)."""
    try:
        from core.orm.security import get_user_groups
        groups = get_user_groups(registry, db, uid)
        return "base.group_portal" in groups
    except Exception:
        return False


SHOP_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Shop - ERP Platform</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }
  .shop-nav { background: #1a1a2e; color: white; padding: 1rem 2rem; display: flex; gap: 1rem; align-items: center; }
  .shop-nav a { color: white; text-decoration: none; }
  .shop-content { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  .shop-content h1 { margin-top: 0; }
  .category-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .category-bar a { padding: 0.35rem 0.75rem; background: white; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #333; font-size: 0.9rem; }
  .category-bar a:hover, .category-bar a.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }
  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; }
  .product-card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-decoration: none; color: inherit; display: block; transition: box-shadow 0.2s; }
  .product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .product-card .name { font-weight: 600; margin-bottom: 0.25rem; }
  .product-card .price { color: #1a1a2e; font-size: 1.1rem; }
  .product-detail { max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .product-detail h1 { margin-top: 0; }
  .product-detail .price { font-size: 1.5rem; font-weight: 600; margin: 1rem 0; }
  .btn-add-cart { display: inline-block; padding: 0.75rem 1.5rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 1rem; }
  .btn-add-cart:hover { background: #2a2a4e; }
</style>
</head>
<body>
<div class="shop-nav">
  <a href="/website">Home</a>
  <a href="/shop">Shop</a>
  <a href="/shop/cart">Cart</a>
</div>
<div class="shop-content">
  {content}
</div>
</body>
</html>"""


@route("/shop", auth="public", methods=["GET"])
def shop_index(request):
    """Public shop - product catalog with category filter (Phase 141)."""
    db = get_session_db(request)
    if not db:
        return Response(SHOP_HTML.format(content="<h1>Shop</h1><p>Database not configured.</p>"), content_type="text/html; charset=utf-8")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Product = env.get("product.product")
        Category = env.get("product.category")
        if not Product:
            return Response(SHOP_HTML.format(content="<h1>Shop</h1><p>Products not available.</p>"), content_type="text/html; charset=utf-8")
        category_id = request.args.get("category", type=int)
        domain = []
        if category_id and Category:
            domain = [("categ_id", "=", category_id)]
        products = Product.search_read(domain, ["id", "name", "list_price", "categ_id"], limit=100)
        categories = []
        if Category:
            categories = Category.search_read([], ["id", "name"], limit=50)
        cat_html = ""
        if categories:
            cat_html = '<div class="category-bar"><a href="/shop">All</a>'
            for c in categories:
                active = ' class="active"' if category_id == c.get("id") else ""
                cat_html += f'<a href="/shop?category={c.get("id")}"{active}>{(c.get("name") or "").replace("<", "&lt;")}</a>'
            cat_html += "</div>"
        grid_html = '<h1>Products</h1>' + cat_html
        if not products:
            grid_html += "<p>No products yet.</p>"
        else:
            grid_html += '<div class="product-grid">'
            for p in products:
                name = (p.get("name") or "").replace("<", "&lt;")
                price = p.get("list_price")
                price_str = f"{price:,.2f}" if price is not None else "0.00"
                pid = p.get("id", "")
                grid_html += f'<a href="/shop/product/{pid}" class="product-card"><div class="name">{name}</div><div class="price">{price_str}</div></a>'
            grid_html += "</div>"
        return Response(SHOP_HTML.format(content=grid_html), content_type="text/html; charset=utf-8")


@route("/shop/product/<int:product_id>", auth="public", methods=["GET"])
def shop_product_detail(request, product_id):
    """Product detail page (Phase 141, 155). Variant selector when template has attributes."""
    db = get_session_db(request)
    if not db:
        return Response(SHOP_HTML.format(content="<h1>Product</h1><p>Database not configured.</p>"), content_type="text/html; charset=utf-8")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Product = env.get("product.product")
        Template = env.get("product.template")
        TemplateLine = env.get("product.template.attribute.line")
        if not Product:
            return Response(SHOP_HTML.format(content="<h1>Product</h1><p>Not found.</p>"), content_type="text/html; charset=utf-8")
        products = Product.search_read(
            [("id", "=", product_id)],
            ["id", "name", "list_price", "categ_id", "product_template_id", "attribute_value_ids"],
        )
        if not products:
            return Response(SHOP_HTML.format(content="<h1>Product</h1><p>Product not found.</p>"), content_type="text/html; charset=utf-8")
        p = products[0]
        name = (p.get("name") or "").replace("<", "&lt;")
        price = p.get("list_price")
        price_str = f"{price:,.2f}" if price is not None else "0.00"
        template_id = p.get("product_template_id")
        if isinstance(template_id, (list, tuple)) and template_id:
            template_id = template_id[0]
        variant_html = ""
        add_product_id = product_id
        if template_id and Template and TemplateLine:
            lines = TemplateLine.search_read([("template_id", "=", template_id)], ["attribute_id", "value_ids"])
            if lines:
                variants = Product.search_read(
                    [("product_template_id", "=", template_id)],
                    ["id", "name", "list_price", "attribute_value_ids"],
                )
                if len(variants) > 1:
                    AttrValue = env.get("product.attribute.value")
                    value_names = {}
                    if AttrValue:
                        for v in variants:
                            for vid in (v.get("attribute_value_ids") or []):
                                if vid and vid not in value_names:
                                    rows = AttrValue.search_read([("id", "=", vid)], ["name"])
                                    if rows:
                                        value_names[vid] = rows[0].get("name", str(vid))
                    variant_html = '<div class="variant-selector" style="margin:1rem 0;"><label>Variant:</label> '
                    for v in variants:
                        vid = v.get("id")
                        vvals = v.get("attribute_value_ids") or []
                        vlabel = ", ".join(value_names.get(x, str(x)) for x in vvals) if vvals else f"#{vid}"
                        sel = " selected" if vid == product_id else ""
                        variant_html += f'<a href="/shop/product/{vid}" class="variant-opt"{sel}>{vlabel}</a> '
                    variant_html += "</div>"
        content = f"""
        <h1>{name}</h1>
        <p><a href="/shop">&larr; Back to shop</a></p>
        <div class="price">{price_str}</div>
        {variant_html}
        <a href="/shop/cart?add={add_product_id}" class="btn-add-cart">Add to Cart</a>
        """
        return Response(SHOP_HTML.format(content=content), content_type="text/html; charset=utf-8")


def _get_cart_from_request(request):
    """Parse cart from erp_cart cookie. Returns list of {product_id, qty}."""
    raw = request.cookies.get("erp_cart") or "[]"
    try:
        decoded = base64.b64decode(raw).decode() if raw else "[]"
        data = json.loads(decoded)
    except Exception:
        try:
            data = json.loads(raw)
        except Exception:
            data = []
    return data if isinstance(data, list) else []


def _cart_response(content, cart=None):
    """Build response with optional Set-Cookie for cart."""
    r = Response(SHOP_HTML.format(content=content), content_type="text/html; charset=utf-8")
    if cart is not None:
        r.set_cookie("erp_cart", base64.b64encode(json.dumps(cart).encode()).decode(), max_age=86400 * 7)
    return r


@route("/shop/cart", auth="public", methods=["GET"])
def shop_cart(request):
    """Cart page - view, add, remove, update qty (Phase 142)."""
    add_id = request.args.get("add", type=int)
    remove_id = request.args.get("remove", type=int)
    cart = _get_cart_from_request(request)
    db = get_session_db(request)
    if add_id:
        found = next((c for c in cart if c.get("product_id") == add_id), None)
        if found:
            found["qty"] = found.get("qty", 1) + 1
        else:
            cart.append({"product_id": add_id, "qty": 1})
    if remove_id:
        cart = [c for c in cart if c.get("product_id") != remove_id]
    if not db:
        return _cart_response("<h1>Cart</h1><p>Database not configured.</p>", cart)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Product = env.get("product.product")
        if not Product or not cart:
            content = '<h1>Cart</h1><p><a href="/shop">Continue shopping</a></p><p>Your cart is empty.</p>'
            return _cart_response(content, cart)
        pids = [c["product_id"] for c in cart]
        products = Product.search_read([("id", "in", pids)], ["id", "name", "list_price"])
        pmap = {p["id"]: p for p in products}
        total = 0
        rows = []
        for c in cart:
            pid = c.get("product_id")
            qty = c.get("qty", 1)
            p = pmap.get(pid)
            if not p:
                continue
            price = p.get("list_price") or 0
            subtotal = price * qty
            total += subtotal
            name = (p.get("name") or "").replace("<", "&lt;")
            rows.append({"pid": pid, "name": name, "qty": qty, "price": price, "subtotal": subtotal})
        content = '<h1>Cart</h1><p><a href="/shop">Continue shopping</a></p>'
        if not rows:
            content += "<p>Your cart is empty.</p>"
        else:
            content += '<table style="width:100%;border-collapse:collapse"><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr>'
            for r in rows:
                content += f'<tr><td>{r["name"]}</td><td>{r["qty"]}</td><td>{r["price"]:,.2f}</td><td>{r["subtotal"]:,.2f}</td><td><a href="/shop/cart?remove={r["pid"]}">Remove</a></td></tr>'
            content += f'<tr><td colspan="3"><strong>Total</strong></td><td><strong>{total:,.2f}</strong></td><td></td></tr></table>'
            content += '<p><a href="/shop/checkout" class="btn-add-cart" style="margin-top:1rem;display:inline-block">Proceed to Checkout</a></p>'
        return _cart_response(content, cart)


@route("/shop/checkout", auth="public", methods=["GET", "POST"])
def shop_checkout(request):
    """Checkout - address form, payment provider, create sale.order + payment.transaction (Phase 142, 156)."""
    cart = _get_cart_from_request(request)
    if not cart:
        return redirect("/shop/cart")
    db = get_session_db(request)
    if not db:
        return Response(SHOP_HTML.format(content="<h1>Checkout</h1><p>Database not configured.</p>"), content_type="text/html; charset=utf-8")
    uid = get_session_uid(request)
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        street = request.form.get("street", "").strip()
        city = request.form.get("city", "").strip()
        provider = request.form.get("provider", "demo")
        if not name or not email:
            content = '<h1>Checkout</h1><p style="color:#c00">Name and email are required.</p>' + _checkout_form(name, email, street, city, provider)
            return Response(SHOP_HTML.format(content=content), content_type="text/html; charset=utf-8")
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=uid or 1)
            registry.set_env(env)
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            Order = env.get("sale.order")
            if not all([Partner, Product, Order]):
                return Response(SHOP_HTML.format(content="<h1>Checkout</h1><p>Sales module not available.</p>"), content_type="text/html; charset=utf-8")
            partner_id = None
            if uid:
                User = env.get("res.users")
                if User:
                    rows = User.read_ids([uid], ["partner_id"])
                    if rows and rows[0].get("partner_id"):
                        pid = rows[0]["partner_id"]
                        partner_id = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
            if not partner_id:
                partner = Partner.create({"name": name, "email": email, "street": street, "city": city})
                partner_id = partner.id if hasattr(partner, "id") else (partner.ids[0] if partner.ids else None)
            if not partner_id:
                return Response(SHOP_HTML.format(content="<h1>Checkout</h1><p>Could not create customer.</p>"), content_type="text/html; charset=utf-8")
            products = Product.search_read([("id", "in", [c["product_id"] for c in cart])], ["id", "name", "list_price"])
            pmap = {p["id"]: p for p in products}
            line_vals = []
            total = 0
            for c in cart:
                p = pmap.get(c["product_id"])
                if not p:
                    continue
                qty = c.get("qty", 1)
                price = p.get("list_price") or 0
                total += price * qty
                line_vals.append({
                    "product_id": p["id"],
                    "name": p.get("name", ""),
                    "product_uom_qty": qty,
                    "price_unit": price,
                })
            if not line_vals:
                return redirect("/shop/cart")
            order = Order.create({
                "partner_id": partner_id,
                "order_line": line_vals,
            })
            order_id = order.id if hasattr(order, "id") else (order.ids[0] if order.ids else None)
            order.action_confirm()
            currency_id = None
            if order_id and hasattr(Order, "read_ids"):
                odata = Order.read_ids([order_id], ["currency_id"])
                if odata:
                    cid = odata[0].get("currency_id")
                    currency_id = cid[0] if isinstance(cid, (list, tuple)) and cid else cid
            r = redirect(f"/shop/confirmation?order={order_id}")
            r.set_cookie("erp_cart", "", max_age=0)
            Provider = env.get("payment.provider")
            Transaction = env.get("payment.transaction")
            if Provider and Transaction and total > 0:
                import secrets
                providers = Provider.search_read([("code", "=", provider), ("state", "in", ["enabled", "test"])], ["id", "code"])
                if not providers:
                    providers = Provider.search_read([("state", "in", ["enabled", "test"])], ["id", "code"], limit=1)
                if providers:
                    ref = f"PAY-{secrets.token_hex(4).upper()}"
                    Transaction.create({
                        "provider_id": providers[0]["id"],
                        "amount": total,
                        "currency_id": currency_id,
                        "partner_id": partner_id,
                        "sale_order_id": order_id,
                        "reference": ref,
                        "state": "done" if providers[0].get("code") == "demo" else "pending",
                    })
                    if providers[0].get("code") == "manual":
                        r = redirect(f"/payment/status/{ref}")
            return r
    content = '<h1>Checkout</h1><p><a href="/shop/cart">&larr; Back to cart</a></p>' + _checkout_form("", "", "", "", "demo")
    return Response(SHOP_HTML.format(content=content), content_type="text/html; charset=utf-8")


def _checkout_form(name, email, street, city, provider="demo"):
    return f'''
    <form method="post" style="max-width:400px;margin-top:1rem">
      <p><label>Name *<br/><input type="text" name="name" value="{html.escape(name)}" style="width:100%;padding:0.5rem" required/></label></p>
      <p><label>Email *<br/><input type="email" name="email" value="{html.escape(email)}" style="width:100%;padding:0.5rem" required/></label></p>
      <p><label>Address<br/><input type="text" name="street" value="{html.escape(street)}" style="width:100%;padding:0.5rem" placeholder="Street"/></label></p>
      <p><label>City<br/><input type="text" name="city" value="{html.escape(city)}" style="width:100%;padding:0.5rem"/></label></p>
      <p><label>Payment<br/><select name="provider" style="width:100%;padding:0.5rem">
        <option value="demo"{" selected" if provider == "demo" else ""}>Demo (instant)</option>
        <option value="manual"{" selected" if provider == "manual" else ""}>Bank Transfer</option>
      </select></label></p>
      <button type="submit" class="btn-add-cart" style="margin-top:1rem">Place Order</button>
    </form>
    '''


@route("/shop/confirmation", auth="public", methods=["GET"])
def shop_confirmation(request):
    """Order confirmation page (Phase 142)."""
    order_id = request.args.get("order", type=int)
    content = "<h1>Thank you!</h1><p>Your order has been placed.</p>"
    if order_id:
        content += f"<p>Order reference: {order_id}</p>"
    content += '<p><a href="/shop">Continue shopping</a></p>'
    return Response(SHOP_HTML.format(content=content), content_type="text/html; charset=utf-8")


@route("/website", auth="public", methods=["GET"])
def website_home(request):
    """Public homepage (Phase 101)."""
    return Response(WEBSITE_HOME_HTML, content_type="text/html; charset=utf-8")


@route("/my", auth="portal", methods=["GET"])
def portal_my(request):
    """Portal dashboard - requires session, allows portal users (Phase 101)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    content = "<h1>My Portal</h1><p>Welcome. Use the menu above to view your leads or edit your profile.</p>"
    return Response(
        PORTAL_MY_HTML.format(content=content),
        content_type="text/html; charset=utf-8",
    )


@route("/my/orders", auth="portal", methods=["GET"])
def portal_my_orders(request):
    """List sale orders where partner_id = current user's partner (Phase 143)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Order = env.get("sale.order")
        if not User or not Order:
            content = "<h1>My Orders</h1><p>Sales module not available.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            content = "<h1>My Orders</h1><p>No contact linked to your account.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        pid = partner_id[0] if isinstance(partner_id, (list, tuple)) and partner_id else partner_id
        orders = Order.search([("partner_id", "=", pid)], order="id desc", limit=50)
        if not orders or not orders.ids:
            content = "<h1>My Orders</h1><p>No orders yet.</p><p><a href=\"/shop\">Browse shop</a></p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        order_rows = Order.browse(orders.ids).read(["name", "partner_id", "amount_total", "state", "date_order"])
        html = "<h1>My Orders</h1><table><tr><th>Order</th><th>Total</th><th>Status</th><th>Date</th></tr>"
        for r in order_rows:
            name = (r.get("name") or "").replace("<", "&lt;")
            total = r.get("amount_total")
            total_str = f"{total:,.2f}" if total is not None else "-"
            state = (r.get("state") or "").replace("<", "&lt;")
            date_order = r.get("date_order") or ""
            if date_order and len(date_order) > 10:
                date_order = date_order[:10]
            oid = r.get("id", "")
            html += f'<tr><td><a href="/my/orders/{oid}">{name}</a></td><td>{total_str}</td><td>{state}</td><td>{date_order}</td></tr>'
        html += "</table>"
        return Response(PORTAL_MY_HTML.format(content=html), content_type="text/html; charset=utf-8")


@route("/my/invoices", auth="portal", methods=["GET"])
def portal_my_invoices(request):
    """List customer invoices where partner_id = current user's partner (Phase 157)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Move = env.get("account.move")
        if not User or not Move:
            content = "<h1>My Invoices</h1><p>Accounting module not available.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            content = "<h1>My Invoices</h1><p>No contact linked to your account.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        pid = partner_id[0] if isinstance(partner_id, (list, tuple)) and partner_id else partner_id
        moves = Move.search([("move_type", "=", "out_invoice"), ("partner_id", "=", pid)], order="id desc", limit=50)
        if not moves or not moves.ids:
            content = "<h1>My Invoices</h1><p>No invoices yet.</p><p><a href=\"/shop\">Browse shop</a></p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        move_rows = Move.browse(moves.ids).read(["id", "name", "partner_id", "state", "invoice_origin", "line_ids"])
        html = "<h1>My Invoices</h1><table><tr><th>Number</th><th>Origin</th><th>Status</th><th></th></tr>"
        for r in move_rows:
            name = (r.get("name") or "").replace("<", "&lt;")
            origin = (r.get("invoice_origin") or "").replace("<", "&lt;")
            state = (r.get("state") or "").replace("<", "&lt;")
            mid = r.get("id", "")
            html += f'<tr><td><a href="/my/invoices/{mid}">{name}</a></td><td>{origin}</td><td>{state}</td>'
            html += f'<td><a href="/report/pdf/account.report_invoice/{mid}">PDF</a></td></tr>'
        html += "</table>"
        return Response(PORTAL_MY_HTML.format(content=html), content_type="text/html; charset=utf-8")


@route("/my/invoices/<int:move_id>", auth="portal", methods=["GET"])
def portal_my_invoice_detail(request, move_id):
    """View single invoice detail (Phase 157)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Move = env.get("account.move")
        Line = env.get("account.move.line")
        if not User or not Move:
            content = "<h1>Invoice</h1><p>Not found.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            content = "<h1>Invoice</h1><p>No contact linked.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        pid = partner_id[0] if isinstance(partner_id, (list, tuple)) and partner_id else partner_id
        allowed = Move.search([("id", "=", move_id), ("move_type", "=", "out_invoice"), ("partner_id", "=", pid)])
        if not allowed or move_id not in (allowed.ids if hasattr(allowed, "ids") else []):
            content = "<h1>Invoice</h1><p>Invoice not found or access denied.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        m = Move.browse(move_id).read(["name", "partner_id", "state", "invoice_origin", "line_ids"])[0]
        name = (m.get("name") or "").replace("<", "&lt;")
        state = (m.get("state") or "").replace("<", "&lt;")
        origin = (m.get("invoice_origin") or "").replace("<", "&lt;")
        line_ids = m.get("line_ids") or []
        if isinstance(line_ids, (list, tuple)) and line_ids:
            lines = Line.browse(line_ids).read(["name", "debit", "credit"]) if Line else []
        else:
            lines = []
        html = f"<h1>Invoice {name}</h1><p><a href=\"/my/invoices\">&larr; Back to invoices</a></p>"
        html += f"<p><strong>Origin:</strong> {origin} | <strong>Status:</strong> {state}</p>"
        html += '<table><tr><th>Description</th><th>Debit</th><th>Credit</th></tr>'
        for ln in lines:
            ln_name = (ln.get("name") or "").replace("<", "&lt;")
            debit = ln.get("debit") or 0
            credit = ln.get("credit") or 0
            html += f"<tr><td>{ln_name}</td><td>{debit:,.2f}</td><td>{credit:,.2f}</td></tr>"
        html += "</table>"
        html += f'<p><a href="/report/pdf/account.report_invoice/{move_id}">Download PDF</a></p>'
        if state in ("draft", "posted") and state != "paid":
            html += f'<p><a href="/my/invoices/{move_id}/pay" class="btn" style="display:inline-block;padding:0.5rem 1rem;background:#1a1a2e;color:white;text-decoration:none;border-radius:4px;margin-top:0.5rem">Pay Online</a></p>'
        return Response(PORTAL_MY_HTML.format(content=html), content_type="text/html; charset=utf-8")


@route("/my/invoices/<int:move_id>/pay", auth="portal", methods=["GET", "POST"])
def portal_my_invoice_pay(request, move_id):
    """Pay invoice online (Phase 199). GET: form, POST: create transaction, redirect."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        Provider = env.get("payment.provider")
        Transaction = env.get("payment.transaction")
        if not all([User, Move, Provider, Transaction]):
            return redirect(f"/my/invoices/{move_id}")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return redirect(f"/my/invoices/{move_id}")
        pid = partner_id[0] if isinstance(partner_id, (list, tuple)) and partner_id else partner_id
        allowed = Move.search([("id", "=", move_id), ("move_type", "=", "out_invoice"), ("partner_id", "=", pid)])
        if not allowed or move_id not in (allowed.ids if hasattr(allowed, "ids") else []):
            return redirect("/my/invoices")
        m = Move.browse(move_id).read(["name", "state", "currency_id", "partner_id"])[0]
        inv_state = m.get("state", "")
        if inv_state == "paid":
            return redirect(f"/my/invoices/{move_id}")
        def _provider_rows(code=None, limit=None):
            domain = [("state", "in", ["enabled", "test"])]
            if code:
                domain.insert(0, ("code", "=", code))
            rows = Provider.search_read(domain, ["id", "code"])
            if rows:
                return rows[:limit] if limit else rows
            params = ["enabled", "test"]
            sql = "SELECT id, code FROM payment_provider WHERE state IN (%s, %s)"
            if code:
                sql += " AND code = %s"
                params.append(code)
            sql += " ORDER BY id"
            if limit:
                sql += " LIMIT %s"
                params.append(limit)
            cr.execute(sql, params)
            return cr.fetchall() or []
        if request.method == "POST":
            provider_code = request.form.get("provider", "demo")
            lines = MoveLine.search([("move_id", "=", move_id)])
            rows = lines.read(["debit", "credit"]) if lines else []
            total = sum(float(r.get("debit") or 0) for r in rows)
            if total <= 0:
                return redirect(f"/my/invoices/{move_id}")
            currency_id = m.get("currency_id")
            currency_id = currency_id[0] if isinstance(currency_id, (list, tuple)) and currency_id else currency_id
            providers = _provider_rows(provider_code)
            if not providers:
                providers = _provider_rows(limit=1)
            if not providers:
                return redirect(f"/my/invoices/{move_id}")
            import secrets
            ref = f"INV-{secrets.token_hex(4).upper()}"
            tx = Transaction.create({
                "provider_id": providers[0]["id"],
                "amount": total,
                "currency_id": currency_id,
                "partner_id": pid,
                "account_move_id": move_id,
                "reference": ref,
                "state": "done" if providers[0].get("code") == "demo" else "pending",
            })
            if providers[0].get("code") == "demo":
                # Phase 732: Phase 731 sync runs on create when state is done; no direct paid write.
                return redirect(f"/my/invoices/{move_id}")
            return redirect(f"/payment/status/{ref}")
        providers = _provider_rows()
        opts = "".join(f'<option value="{p.get("code", "")}">{p.get("code", "demo").title()}</option>' for p in providers)
        sid = request.cookies.get("erp_session")
        csrf_token = ensure_session_csrf(sid) if sid else ""
        content = f"""
        <h1>Pay Invoice</h1>
        <p><a href="/my/invoices/{move_id}">&larr; Back to invoice</a></p>
        <form method="post" style="max-width:400px;margin-top:1rem">
          <input type="hidden" name="csrf_token" value="{csrf_token}"/>
          <p><label>Payment method<br/><select name="provider" style="width:100%;padding:0.5rem">{opts}</select></label></p>
          <button type="submit" class="btn" style="margin-top:1rem;padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Pay Now</button>
        </form>
        """
        return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")


@route("/my/orders/<int:order_id>", auth="portal", methods=["GET"])
def portal_my_order_detail(request, order_id):
    """View single order detail (Phase 143)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Order = env.get("sale.order")
        OrderLine = env.get("sale.order.line")
        if not User or not Order:
            return redirect("/my/orders")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return redirect("/my/orders")
        pid = partner_id[0] if isinstance(partner_id, (list, tuple)) and partner_id else partner_id
        orders = Order.search([("partner_id", "=", pid), ("id", "=", order_id)], limit=1)
        if not orders or not orders.ids:
            return redirect("/my/orders")
        order = Order.browse(orders.ids[0])
        order_row = order.read(["name", "partner_id", "amount_total", "state", "date_order", "order_line"])[0]
        name = (order_row.get("name") or "").replace("<", "&lt;")
        total = order_row.get("amount_total")
        total_str = f"{total:,.2f}" if total is not None else "-"
        state = (order_row.get("state") or "").replace("<", "&lt;")
        date_order = (order_row.get("date_order") or "")[:10] if order_row.get("date_order") else ""
        line_ids = order_row.get("order_line") or []
        if isinstance(line_ids, list) and line_ids:
            line_ids = [x[0] if isinstance(x, (list, tuple)) and x else x for x in line_ids]
        lines_html = ""
        if line_ids and OrderLine:
            line_rows = OrderLine.browse(line_ids).read(["name", "product_uom_qty", "price_unit", "price_subtotal"])
            lines_html = "<table style=\"margin-top:1rem;width:100%\"><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>"
            for ln in line_rows:
                lname = (ln.get("name") or "").replace("<", "&lt;")
                qty = ln.get("product_uom_qty") or 0
                pu = ln.get("price_unit") or 0
                ps = ln.get("price_subtotal") or 0
                lines_html += f"<tr><td>{lname}</td><td>{qty}</td><td>{pu:,.2f}</td><td>{ps:,.2f}</td></tr>"
            lines_html += "</table>"
        content = f"""
        <h1>{name}</h1>
        <p><a href="/my/orders">&larr; Back to orders</a></p>
        <table style="margin-top:1rem"><tr><th>Status</th><td>{state}</td></tr><tr><th>Date</th><td>{date_order}</td></tr><tr><th>Total</th><td>{total_str}</td></tr></table>
        {lines_html}
        """
        return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")


@route("/my/leads", auth="portal", methods=["GET"])
def portal_my_leads(request):
    """List leads where partner_id = current user's partner (Phase 101)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Lead = env.get("crm.lead")
        if not User or not Lead:
            content = "<h1>My Leads</h1><p>Leads module not available.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            content = "<h1>My Leads</h1><p>No contact linked to your account.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        leads = Lead.search([("partner_id", "=", partner_id)], order="id desc", limit=50)
        if not leads or not leads.ids:
            content = "<h1>My Leads</h1><p>No leads found.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        lead_rows = Lead.browse(leads.ids).read(["name", "partner_name", "expected_revenue", "date_deadline"])
        html = "<h1>My Leads</h1><table><tr><th>Name</th><th>Contact</th><th>Expected Revenue</th><th>Deadline</th></tr>"
        for r in lead_rows:
            name = (r.get("name") or "").replace("<", "&lt;")
            pname = (r.get("partner_name") or "").replace("<", "&lt;")
            rev = r.get("expected_revenue") or ""
            dl = r.get("date_deadline") or ""
            lid = r.get("id", "")
            html += f'<tr><td><a href="/my/leads/{lid}">{name}</a></td><td>{pname}</td><td>{rev}</td><td>{dl}</td></tr>'
        html += "</table>"
        return Response(PORTAL_MY_HTML.format(content=html), content_type="text/html; charset=utf-8")


@route("/my/calendar", auth="portal", methods=["GET"])
def portal_my_calendar(request):
    """List calendar events where current user's partner is attendee (Phase 167)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        CalendarEvent = env.get("calendar.event")
        CalendarAttendee = env.get("calendar.attendee")
        if not User or not CalendarEvent:
            content = "<h1>My Calendar</h1><p>Calendar module not available.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            content = "<h1>My Calendar</h1><p>No contact linked to your account.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        event_ids = []
        if CalendarAttendee:
            attendees = CalendarAttendee.search([("partner_id", "=", partner_id)], limit=200)
            if attendees and attendees.ids:
                att_rows = CalendarAttendee.browse(attendees.ids).read(["event_id"])
                event_ids = list(dict.fromkeys(r.get("event_id") for r in att_rows if r.get("event_id")))
        if not event_ids and cr:
            try:
                cr.execute(
                    "SELECT event_id FROM calendar_event_res_partner_rel WHERE partner_id = %s",
                    (partner_id,),
                )
                event_ids = [r["event_id"] if hasattr(r, "keys") else r[0] for r in cr.fetchall()]
            except Exception:
                pass
        if not event_ids:
            content = "<h1>My Calendar</h1><p>No meetings found.</p>"
            return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")
        events = CalendarEvent.browse(event_ids).read(["name", "start", "stop", "location"])
        html = "<h1>My Calendar</h1><table><tr><th>Meeting</th><th>Start</th><th>End</th><th>Location</th></tr>"
        for r in sorted(events, key=lambda x: (x.get("start") or "")):
            name = (r.get("name") or "").replace("<", "&lt;")
            start = (r.get("start") or "")[:19].replace("T", " ") if r.get("start") else ""
            stop = (r.get("stop") or "")[:19].replace("T", " ") if r.get("stop") else ""
            loc = (r.get("location") or "").replace("<", "&lt;")
            eid = r.get("id", "")
            html += f'<tr><td><a href="/my/calendar/{eid}">{name}</a></td><td>{start}</td><td>{stop}</td><td>{loc}</td></tr>'
        html += "</table>"
        return Response(PORTAL_MY_HTML.format(content=html), content_type="text/html; charset=utf-8")


@route("/my/calendar/<int:event_id>", auth="portal", methods=["GET"])
def portal_my_calendar_detail(request, event_id):
    """View single calendar event (Phase 167)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        CalendarEvent = env.get("calendar.event")
        CalendarAttendee = env.get("calendar.attendee")
        if not User or not CalendarEvent:
            return redirect("/my/calendar")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return redirect("/my/calendar")
        event_ids = []
        if CalendarAttendee:
            attendees = CalendarAttendee.search([("partner_id", "=", partner_id), ("event_id", "=", event_id)], limit=1)
            if attendees and attendees.ids:
                event_ids = [event_id]
        if not event_ids and cr:
            try:
                cr.execute(
                    "SELECT 1 FROM calendar_event_res_partner_rel WHERE event_id = %s AND partner_id = %s",
                    (event_id, partner_id),
                )
                if cr.fetchone():
                    event_ids = [event_id]
            except Exception:
                pass
        if not event_ids:
            return redirect("/my/calendar")
        event = CalendarEvent.browse(event_ids[0])
        row = event.read(["name", "start", "stop", "location", "description"])[0]
        name = (row.get("name") or "").replace("<", "&lt;")
        start = (row.get("start") or "")[:19].replace("T", " ") if row.get("start") else ""
        stop = (row.get("stop") or "")[:19].replace("T", " ") if row.get("stop") else ""
        loc = (row.get("location") or "").replace("<", "&lt;")
        desc = (row.get("description") or "").replace("<", "&lt;").replace("\n", "<br/>")
        content = f"<h1>{name}</h1><p><a href=\"/my/calendar\">&larr; Back to calendar</a></p>"
        content += f"<table style=\"margin-top:1rem\"><tr><th>Start</th><td>{start}</td></tr>"
        content += f"<tr><th>End</th><td>{stop}</td></tr><tr><th>Location</th><td>{loc}</td></tr></table>"
        if desc:
            content += f"<h3>Description</h3><p>{desc}</p>"
        return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")


@route("/my/leads/<int:lead_id>", auth="portal", methods=["GET"])
def portal_my_lead_detail(request, lead_id):
    """View single lead with chatter (messages, activities, attachments) (Phase 111)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Lead = env.get("crm.lead")
        if not User or not Lead:
            return redirect("/my/leads")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return redirect("/my/leads")
        leads = Lead.search([("partner_id", "=", partner_id), ("id", "=", lead_id)], limit=1)
        if not leads or not leads.ids:
            return redirect("/my/leads")
        lead = Lead.browse(leads.ids[0])
        lead_row = lead.read(["name", "partner_name", "expected_revenue", "date_deadline", "description"])[0]
        name = (lead_row.get("name") or "").replace("<", "&lt;")
        pname = (lead_row.get("partner_name") or "").replace("<", "&lt;")
        rev = lead_row.get("expected_revenue") or ""
        dl = lead_row.get("date_deadline") or ""
        desc = (lead_row.get("description") or "").replace("<", "&lt;").replace("\n", "<br/>")
        # Messages (Phase 111)
        MailMessage = env.get("mail.message")
        msg_html = ""
        if MailMessage:
            msgs = MailMessage.search([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)], order="id asc")
            if msgs and msgs.ids:
                msg_rows = MailMessage.browse(msgs.ids).read(["body", "author_id", "date"])
                UserModel = env.get("res.users")
                for m in msg_rows:
                    author_name = "Unknown"
                    if m.get("author_id") and UserModel:
                        urows = UserModel.read_ids([m["author_id"]], ["name"])
                        if urows:
                            author_name = (urows[0].get("name") or "").replace("<", "&lt;")
                    body = (m.get("body") or "").replace("<", "&lt;").replace("\n", "<br/>")
                    date_str = (m.get("date") or "")[:19].replace("T", " ") if m.get("date") else ""
                    msg_html += f'<div class="chatter-msg" style="padding:0.5rem 0;border-bottom:1px solid #eee"><div style="font-size:0.85rem;color:#666">{author_name} · {date_str}</div><div style="margin-top:0.25rem">{body}</div></div>'
        # Activities (Phase 111)
        MailActivity = env.get("mail.activity")
        act_html = ""
        if MailActivity:
            acts = MailActivity.search([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)], order="date_deadline asc")
            if acts and acts.ids:
                act_rows = MailActivity.browse(acts.ids).read(["summary", "note", "date_deadline", "state"])
                for a in act_rows:
                    summary = (a.get("summary") or "").replace("<", "&lt;")
                    note = (a.get("note") or "").replace("<", "&lt;").replace("\n", "<br/>")
                    dl_a = a.get("date_deadline") or ""
                    state = a.get("state") or ""
                    act_html += f'<div class="chatter-act" style="padding:0.5rem 0;border-bottom:1px solid #eee"><strong>{summary}</strong> ({state}) · {dl_a}<br/>{note}</div>'
        # Attachments (Phase 111)
        Attachment = env.get("ir.attachment")
        att_html = ""
        if Attachment:
            atts = Attachment.search([("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)])
            if atts and atts.ids:
                att_rows = Attachment.browse(atts.ids).read(["name"])
                for a in att_rows:
                    aname = (a.get("name") or "").replace("<", "&lt;")
                    att_html += f'<div class="chatter-att" style="padding:0.25rem 0"><a href="/my/attachment/{a.get("id")}" target="_blank">{aname}</a></div>'
        chatter = ""
        if msg_html or act_html or att_html:
            chatter = '<div class="portal-chatter" style="margin-top:1.5rem;padding:1rem;background:#f8f8f8;border-radius:8px;border:1px solid #eee">'
            if msg_html:
                chatter += '<h3 style="margin-top:0">Messages</h3><div class="chatter-msgs">' + msg_html + "</div>"
            if act_html:
                chatter += '<h3 style="margin-top:1rem">Activities</h3><div class="chatter-acts">' + act_html + "</div>"
            if att_html:
                chatter += '<h3 style="margin-top:1rem">Attachments</h3><div class="chatter-atts">' + att_html + "</div>"
            chatter += '<form method="post" action="/my/leads/' + str(lead_id) + '/message" style="margin-top:1rem"><textarea name="body" placeholder="Add a comment..." style="width:100%;min-height:60px;padding:0.5rem;border:1px solid #ddd;border-radius:4px"></textarea><button type="submit" class="btn" style="margin-top:0.5rem">Send</button></form></div>'
        content = f"""
        <h1>{name}</h1>
        <p><a href="/my/leads">&larr; Back to leads</a></p>
        <table style="margin-top:1rem"><tr><th>Contact</th><td>{pname}</td></tr><tr><th>Expected Revenue</th><td>{rev}</td></tr><tr><th>Deadline</th><td>{dl}</td></tr></table>
        {f'<p><strong>Description:</strong><br/>{desc}</p>' if desc else ''}
        {chatter}
        """
        return Response(PORTAL_MY_HTML.format(content=content), content_type="text/html; charset=utf-8")


@route("/my/leads/<int:lead_id>/message", auth="portal", methods=["POST"])
def portal_my_lead_message(request, lead_id):
    """Post a message on a lead (Phase 111)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    body = (request.form.get("body") or "").strip()
    if not body:
        return redirect(f"/my/leads/{lead_id}")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Lead = env.get("crm.lead")
        if not User or not Lead:
            return redirect("/my/leads")
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return redirect("/my/leads")
        leads = Lead.search([("partner_id", "=", partner_id), ("id", "=", lead_id)], limit=1)
        if not leads or not leads.ids:
            return redirect("/my/leads")
        lead = Lead.browse(leads.ids[0])
        lead.message_post(body=body, message_type="comment")
    return redirect(f"/my/leads/{lead_id}")


@route("/my/attachment/<int:att_id>", auth="portal", methods=["GET"])
def portal_my_attachment(request, att_id):
    """Download attachment if it belongs to a lead the portal user can access (Phase 111)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    with get_cursor(db) as cr:
        from core.orm import Environment
        from werkzeug.wrappers import Response as WResponse
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Lead = env.get("crm.lead")
        Attachment = env.get("ir.attachment")
        if not all([User, Lead, Attachment]):
            return WResponse("Not found", status=404)
        rows = User.read_ids([uid], ["partner_id"])
        partner_id = rows[0].get("partner_id") if rows else None
        if not partner_id:
            return WResponse("Forbidden", status=403)
        atts = Attachment.search([("id", "=", att_id), ("res_model", "=", "crm.lead")])
        if not atts or not atts.ids:
            return WResponse("Not found", status=404)
        att = Attachment.browse(atts.ids[0])
        att_data = att.read(["res_id", "name", "datas"])[0]
        res_id = att_data.get("res_id")
        if not res_id:
            return WResponse("Not found", status=404)
        leads = Lead.search([("partner_id", "=", partner_id), ("id", "=", res_id)], limit=1)
        if not leads or not leads.ids:
            return WResponse("Forbidden", status=403)
        datas = att_data.get("datas")
        name = att_data.get("name") or "attachment"
        if not datas:
            return WResponse("Empty file", status=404)
        import base64
        try:
            content = base64.b64decode(datas) if isinstance(datas, str) else datas
        except Exception:
            return WResponse("Invalid content", status=500)
        return WResponse(
            content,
            mimetype="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{name}"'},
        )


@route("/my/profile", auth="portal", methods=["GET", "POST"])
def portal_my_profile(request):
    """Edit name, email, password (Phase 101)."""
    uid, db = _require_portal_session(request)
    if uid is None:
        return redirect("/web/login")
    registry = _get_registry(db)
    if not _is_portal_user(registry, db, uid):
        return redirect("/")
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        with get_cursor(db) as cr:
            from core.orm import Environment
            from core.http.auth import hash_password
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            User = env.get("res.users")
            if User:
                vals = {}
                if name:
                    vals["name"] = name
                if email:
                    vals["email"] = email
                if password:
                    vals["password"] = hash_password(password)
                if vals:
                    User.browse([uid]).write(vals)
        return redirect("/my/profile")
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        rows = User.read_ids([uid], ["name", "email"]) if User else []
        name = rows[0].get("name", "") if rows else ""
        email = rows[0].get("email", "") if rows else ""
    form = f"""
    <h1>My Profile</h1>
    <form method="post" style="max-width: 400px;">
      <p><label>Name: <input type="text" name="name" value="{name.replace('"', '&quot;')}" style="width:100%;"/></label></p>
      <p><label>Email: <input type="email" name="email" value="{email.replace('"', '&quot;')}" style="width:100%;"/></label></p>
      <p><label>New password (leave blank to keep): <input type="password" name="password" style="width:100%;"/></label></p>
      <button type="submit" class="btn">Save</button>
    </form>
    """
    return Response(PORTAL_MY_HTML.format(content=form), content_type="text/html; charset=utf-8")
