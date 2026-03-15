"""Bus longpolling and WebSocket controller (Phases 92, 95)."""

import json
import time

from werkzeug.wrappers import Response

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
from core.sql_db import get_cursor


def _handle_websocket(environ, start_response):
    """WebSocket handler for /websocket/ (Phase 95). Polls bus and pushes to client."""
    try:
        from simple_websocket import Server, ConnectionClosed
    except ImportError:
        start_response("501 Not Implemented", [("Content-Type", "text/plain")])
        return [b"WebSocket not available: install simple-websocket"]

    # Werkzeug dev server: simple_websocket writes 101 directly to socket, but server
    # then calls write(b"") before start_response was used -> AssertionError. Return 426
    # so client falls back to longpolling; use gevent/eventlet for production WebSocket.
    if "werkzeug.socket" in environ and "gunicorn.socket" not in environ:
        start_response("426 Upgrade Required", [
            ("Content-Type", "text/plain"),
            ("Upgrade", "WebSocket"),
            ("Connection", "Upgrade"),
        ])
        return [b"WebSocket requires gevent/eventlet. Use longpolling."]

    ws = None
    try:
        ws = Server.accept(environ)
        from core.http.auth import get_session_uid, get_session_db
        from core.http.request import Request
        req = Request(environ)
        uid = get_session_uid(req)
        if uid is None:
            ws.close(message="unauthorized")
            return []
        db = get_session_db(req)
        registry = _get_registry(db)
        last_id = 0
        channels = []
        try:
            init_msg = ws.receive(timeout=5)
            if init_msg:
                data = json.loads(init_msg) if isinstance(init_msg, str) else {}
                channels = data.get("channels") or []
                last_id = int(data.get("last") or 0)
        except Exception:
            pass
        if not channels:
            channels = ["res.partner_" + str(uid)]
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            BusBus = env.get("bus.bus")
            for _ in range(300):
                try:
                    if BusBus:
                        domain = [("id", ">", last_id), ("channel", "in", channels)]
                        rows = BusBus.search_read(domain, fields=["id", "channel", "message", "create_date"], limit=50)
                        if rows:
                            result = [{"id": r["id"], "channel": r.get("channel"), "message": r.get("message"), "create_date": str(r.get("create_date") or "")} for r in rows]
                            new_last = max(r["id"] for r in rows)
                            ws.send(json.dumps({"messages": result, "last": new_last}))
                            last_id = new_last
                    ws.receive(timeout=1)
                except ConnectionClosed:
                    break
                except Exception:
                    pass
        ws.close()
    except Exception:
        if ws:
            try:
                ws.close()
            except Exception:
                pass
    return []


@route("/longpolling/poll", auth="user", methods=["POST"])
def longpolling_poll(request):
    """Poll for new bus messages. POST body: {channels: [...], last: <id>}. Returns new records since last."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    data = {}
    try:
        data = request.get_json(force=True, silent=True) or {}
        channels = data.get("channels") or []
        last_id = int(data.get("last") or 0)
        if not channels:
            return Response(json.dumps({"messages": [], "last": last_id}), content_type="application/json")
        db = get_session_db(request)
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            BusBus = env.get("bus.bus")
            if not BusBus:
                return Response(json.dumps({"messages": [], "last": last_id}), content_type="application/json")
            for _ in range(30):
                domain = [("id", ">", last_id), ("channel", "in", channels)]
                rows = BusBus.search_read(domain, fields=["id", "channel", "message", "create_date"], limit=50)
                if rows:
                    result = [{"id": r["id"], "channel": r.get("channel"), "message": r.get("message"), "create_date": r.get("create_date")} for r in rows]
                    new_last = max(r["id"] for r in rows)
                    return Response(json.dumps({"messages": result, "last": new_last}), content_type="application/json")
                time.sleep(1)
        return Response(json.dumps({"messages": [], "last": last_id}), content_type="application/json")
    except Exception as e:
        last_id = data.get("last", 0) if "data" in dir() else 0
        return Response(json.dumps({"error": str(e), "messages": [], "last": last_id}), status=500, content_type="application/json")
