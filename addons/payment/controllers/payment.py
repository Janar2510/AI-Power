"""Payment controllers (Phase 156)."""

import secrets

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.http.controller import route
from core.http.auth import get_session_db, get_session_uid, _get_registry
from core.sql_db import get_cursor


@route("/payment/process", auth="public", methods=["POST"])
def payment_process(request):
    """Initiate payment. Creates transaction, redirects based on provider (Phase 156)."""
    db = get_session_db(request)
    if not db:
        return Response("<h1>Payment</h1><p>Database not configured.</p>", content_type="text/html; charset=utf-8")
    provider_code = request.form.get("provider", "demo")
    order_id = request.form.get("order_id", type=int)
    amount = request.form.get("amount", type=float)
    currency_id = request.form.get("currency_id")
    partner_id = request.form.get("partner_id")
    if not order_id or not amount:
        return redirect("/shop/cart")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=get_session_uid(request) or 1)
        registry.set_env(env)
        Provider = env.get("payment.provider")
        Transaction = env.get("payment.transaction")
        if not Provider or not Transaction:
            return redirect("/shop/confirmation?order=" + str(order_id))
        providers = Provider.search_read([("code", "=", provider_code), ("state", "in", ["enabled", "test"])], ["id"])
        if not providers:
            providers = Provider.search_read([("state", "in", ["enabled", "test"])], ["id", "code"], limit=1)
        provider_id = providers[0]["id"] if providers else None
        if not provider_id:
            return redirect("/shop/confirmation?order=" + str(order_id))
        ref = f"PAY-{secrets.token_hex(4).upper()}"
        tx = Transaction.create({
            "provider_id": provider_id,
            "amount": amount,
            "currency_id": int(currency_id) if currency_id else None,
            "partner_id": int(partner_id) if partner_id else None,
            "sale_order_id": order_id,
            "reference": ref,
            "state": "pending",
        })
        prov = providers[0]
        code = prov.get("code", "demo")
        if code == "demo":
            tx.write({"state": "done"})
            return redirect(f"/shop/confirmation?order={order_id}&tx={ref}")
        if code == "manual":
            return redirect(f"/payment/status/{ref}")
    return redirect("/shop/confirmation?order=" + str(order_id))


@route("/payment/status/<reference>", auth="public", methods=["GET"])
def payment_status(request, reference):
    """Show payment status / manual transfer instructions (Phase 156)."""
    db = get_session_db(request)
    if not db:
        return Response("<h1>Payment</h1><p>Database not configured.</p>", content_type="text/html; charset=utf-8")
    registry = _get_registry(db)
    with registry.cursor() as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Transaction = env.get("payment.transaction")
        if not Transaction:
            return Response("<h1>Payment</h1><p>Not found.</p>", content_type="text/html; charset=utf-8")
        rows = Transaction.search_read(
            [("reference", "=", reference)],
            ["state", "amount", "currency_id", "sale_order_id", "account_move_id"],
        )
        if not rows:
            return Response("<h1>Payment</h1><p>Transaction not found.</p>", content_type="text/html; charset=utf-8")
        tx = rows[0]
        state = tx.get("state", "")
        amount = tx.get("amount", 0)
        order_id = tx.get("sale_order_id")
        move_id = tx.get("account_move_id")
        if isinstance(order_id, (list, tuple)) and order_id:
            order_id = order_id[0]
        if isinstance(move_id, (list, tuple)) and move_id:
            move_id = move_id[0]
        if state == "done":
            if move_id:
                Move = env.get("account.move")
                if Move:
                    Move.browse(move_id).write({"state": "paid"})
                return redirect(f"/my/invoices/{move_id}")
            if order_id:
                return redirect(f"/shop/confirmation?order={order_id}")
        back_url = f"/my/invoices/{move_id}" if move_id else (f"/shop/confirmation?order={order_id}" if order_id else "/shop")
        html = f"""
        <h1>Payment Pending</h1>
        <p>Reference: <strong>{reference}</strong></p>
        <p>Amount: <strong>{amount:,.2f}</strong></p>
        <p>Please transfer the amount to our bank account. We will confirm upon receipt.</p>
        <p>Bank: Demo Bank | IBAN: EE00 0000 0000 0000 0000</p>
        <p><a href="{back_url}">Back</a></p>
        <p><a href="/shop">Continue shopping</a></p>
        """
        return Response(html, content_type="text/html; charset=utf-8")


@route("/payment/callback", auth="public", methods=["POST", "GET"])
def payment_callback(request):
    """Webhook from payment provider (Phase 156). Placeholder for Stripe etc."""
    return Response("OK", content_type="text/plain")
