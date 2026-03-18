"""Mailing track and unsubscribe controllers (Phase 207)."""

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.http.controller import route
from core.http.auth import get_session_db, _get_registry
from core.sql_db import get_cursor


@route("/mail/track/open/<token>", auth="public", methods=["GET"])
def mail_track_open(request, token):
    """1x1 pixel for open tracking. Returns transparent GIF."""
    db = get_session_db(request)
    if not db:
        return _transparent_gif()
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            from addons.mailing.models.mailing_mailing import MailingMailing
            MailingMailing.track_open(env, token)
    except Exception:
        pass
    return _transparent_gif()


def _transparent_gif() -> Response:
    """Return 1x1 transparent GIF."""
    gif = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    return Response(gif, content_type="image/gif")


@route("/mail/track/click/<token>", auth="public", methods=["GET"])
def mail_track_click(request, token):
    """Track click and redirect to url param."""
    db = get_session_db(request)
    url = request.args.get("url", "/")
    if not db:
        return redirect(url or "/")
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            from addons.mailing.models.mailing_mailing import MailingMailing
            target = MailingMailing.track_click(env, token, url)
            return redirect(target or "/")
    except Exception:
        return redirect(url or "/")


@route("/mail/unsubscribe/<token>", auth="public", methods=["GET", "POST"])
def mail_unsubscribe(request, token):
    """Unsubscribe from mailing list. Shows confirmation page."""
    db = get_session_db(request)
    if not db:
        return Response("<h1>Unsubscribe</h1><p>Database not configured.</p>", content_type="text/html; charset=utf-8")
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            from addons.mailing.models.mailing_mailing import MailingMailing
            ok = MailingMailing.unsubscribe(env, token)
            if ok:
                return Response(
                    "<!DOCTYPE html><html><head><meta charset='utf-8'/></head><body>"
                    "<h1>Unsubscribed</h1><p>You have been unsubscribed from the mailing list.</p>"
                    "</body></html>",
                    content_type="text/html; charset=utf-8",
                )
    except Exception:
        pass
    return Response(
        "<!DOCTYPE html><html><head><meta charset='utf-8'/></head><body>"
        "<h1>Unsubscribe</h1><p>Invalid or expired link.</p>"
        "</body></html>",
        content_type="text/html; charset=utf-8",
    )
