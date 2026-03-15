"""Website and portal controllers (Phase 101)."""

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
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
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }
  .portal-nav { background: #1a1a2e; color: white; padding: 1rem 2rem; display: flex; gap: 1rem; align-items: center; }
  .portal-nav a { color: white; text-decoration: none; }
  .portal-content { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  .portal-content h1 { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th, td { padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f8f8f8; }
  .btn { display: inline-block; padding: 0.5rem 1rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
</style>
</head>
<body>
<div class="portal-nav">
  <a href="/my">Dashboard</a>
  <a href="/my/leads">My Leads</a>
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
