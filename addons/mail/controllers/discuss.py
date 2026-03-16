"""Discuss controller - mail.channel routes (Phase 147)."""

import json

from werkzeug.wrappers import Response

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
from core.sql_db import get_cursor


@route("/discuss/channel/list", auth="user", methods=["GET"])
def discuss_channel_list(request):
    """List channels where current user is a member."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        Member = env.get("mail.channel.member")
        Channel = env.get("mail.channel")
        if not Member or not Channel:
            return Response(json.dumps([]), content_type="application/json")
        members = Member.search([("user_id", "=", uid)])
        if not members.ids:
            return Response(json.dumps([]), content_type="application/json")
        channel_ids = []
        for m in members:
            r = m.read(["channel_id"])
            if not r:
                continue
            c = r[0].get("channel_id")
            if c is None:
                continue
            cid = c[0] if isinstance(c, (list, tuple)) else c
            if cid and cid not in channel_ids:
                channel_ids.append(cid)
        if not channel_ids:
            return Response(json.dumps([]), content_type="application/json")
        channels = Channel.browse(channel_ids)
        rows = channels.read(["id", "name", "channel_type", "description"])
        return Response(json.dumps(rows), content_type="application/json")


@route("/discuss/channel/create", auth="user", methods=["POST"])
def discuss_channel_create(request):
    """Create a channel. Body: {name, channel_type?, user_ids?}."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return Response('{"error": "name required"}', status=400, content_type="application/json")
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        Channel = env.get("mail.channel")
        Member = env.get("mail.channel.member")
        if not Channel or not Member:
            return Response('{"error": "mail.channel not available"}', status=500, content_type="application/json")
        channel_type = data.get("channel_type", "channel")
        user_ids = data.get("user_ids") or [uid]
        if uid not in user_ids:
            user_ids = [uid] + [u for u in user_ids if u != uid]
        channel = Channel.create({
            "name": name,
            "channel_type": channel_type,
            "description": data.get("description", ""),
        })
        cid = channel.ids[0] if channel.ids else channel.id
        for u in user_ids:
            Member.create({"channel_id": cid, "user_id": u})
        row = channel.read(["id", "name", "channel_type", "description"])[0]
        return Response(json.dumps(row), content_type="application/json", status=201)


@route("/discuss/channel/<int:channel_id>/messages", auth="user", methods=["GET"])
def discuss_channel_messages(request, channel_id):
    """Get messages for a channel."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        Member = env.get("mail.channel.member")
        Message = env.get("mail.message")
        if not Member or not Message:
            return Response(json.dumps([]), content_type="application/json")
        is_member = Member.search([("channel_id", "=", channel_id), ("user_id", "=", uid)], limit=1)
        if not is_member.ids:
            return Response('{"error": "not a member"}', status=403, content_type="application/json")
        domain = [("res_model", "=", "mail.channel"), ("res_id", "=", channel_id)]
        messages = Message.search_read(domain, fields=["id", "body", "author_id", "date", "message_type"], order="id asc")
        return Response(json.dumps(messages), content_type="application/json")


@route("/mail/notifications", auth="user", methods=["GET"])
def mail_notifications(request):
    """List unread notifications for current user."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Notification = env.get("mail.notification")
        if not User or not Notification:
            return Response(json.dumps([]), content_type="application/json")
        user_row = User.read_ids([uid], ["partner_id"])
        if not user_row or not user_row[0].get("partner_id"):
            return Response(json.dumps([]), content_type="application/json")
        pid = user_row[0]["partner_id"]
        pid = pid[0] if isinstance(pid, (list, tuple)) else pid
        domain = [("res_partner_id", "=", pid), ("is_read", "=", False)]
        notifs = Notification.search_read(domain, fields=["id", "mail_message_id"], limit=50, order="id desc")
        Message = env.get("mail.message")
        out = []
        for n in notifs or []:
            mid = n.get("mail_message_id")
            mid = mid[0] if isinstance(mid, (list, tuple)) else mid
            msg_row = {}
            if mid and Message:
                msgs = Message.read_ids([mid], ["body", "res_model", "res_id", "date"])
                if msgs:
                    msg_row = msgs[0]
            out.append({
                "id": n.get("id"),
                "body": (msg_row.get("body") or "")[:200],
                "res_model": msg_row.get("res_model") or n.get("res_model"),
                "res_id": msg_row.get("res_id") or n.get("res_id"),
                "date": msg_row.get("date", ""),
            })
        return Response(json.dumps(out), content_type="application/json")


@route("/mail/notifications/mark_read", auth="user", methods=["POST"])
def mail_notifications_mark_read(request):
    """Mark notifications as read. Body: {ids?: [1,2], all?: true}."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    data = request.get_json(force=True, silent=True) or {}
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        User = env.get("res.users")
        Notification = env.get("mail.notification")
        if not User or not Notification:
            return Response(json.dumps({"ok": True}), content_type="application/json")
        user_row = User.read_ids([uid], ["partner_id"])
        if not user_row or not user_row[0].get("partner_id"):
            return Response(json.dumps({"ok": True}), content_type="application/json")
        pid = user_row[0]["partner_id"]
        pid = pid[0] if isinstance(pid, (list, tuple)) else pid
        domain = [("res_partner_id", "=", pid)]
        if data.get("all"):
            pass
        elif data.get("ids"):
            domain.append(("id", "in", data["ids"]))
        else:
            return Response(json.dumps({"ok": True}), content_type="application/json")
        recs = Notification.search(domain)
        if recs.ids:
            Notification.browse(recs.ids).write({"is_read": True})
        return Response(json.dumps({"ok": True}), content_type="application/json")


@route("/discuss/channel/<int:channel_id>/post", auth="user", methods=["POST"])
def discuss_channel_post(request, channel_id):
    """Post a message to a channel. Body: {body}."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    data = request.get_json(force=True, silent=True) or {}
    body = data.get("body", "").strip()
    db = get_session_db(request)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        Channel = env.get("mail.channel")
        Member = env.get("mail.channel.member")
        if not Channel or not Member:
            return Response('{"error": "mail.channel not available"}', status=500, content_type="application/json")
        is_member = Member.search([("channel_id", "=", channel_id), ("user_id", "=", uid)], limit=1)
        if not is_member.ids:
            return Response('{"error": "not a member"}', status=403, content_type="application/json")
        channel = Channel.browse([channel_id])
        if not channel.ids:
            return Response('{"error": "channel not found"}', status=404, content_type="application/json")
        msg = channel.message_post(body=body or "(no message)", message_type="comment")
        mid = msg.ids[0] if msg.ids else msg.id
        row = msg.read(["id", "body", "author_id", "date", "message_type"])[0]
        return Response(json.dumps(row), content_type="application/json", status=201)
