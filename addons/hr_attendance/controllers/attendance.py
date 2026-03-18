"""Phase 217: Attendance kiosk - check-in/out with PIN."""

from werkzeug.wrappers import Response

from core.http.controller import route
from core.http.auth import get_session_db, _get_registry
from core.sql_db import get_cursor


KIOSK_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Attendance Kiosk</title>
<style>
body{font-family:system-ui;max-width:400px;margin:4rem auto;padding:2rem;text-align:center}
input{padding:0.5rem;margin:0.5rem;font-size:1rem}
button{padding:0.75rem 1.5rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;font-size:1rem}
.msg{color:green;margin:1rem 0}
.error{color:red}
</style></head><body>
<h1>Attendance Kiosk</h1>
<form method="post">
<input type="text" name="pin" placeholder="PIN" autofocus/>
<button type="submit" name="action" value="check_in">Check In</button>
<button type="submit" name="action" value="check_out">Check Out</button>
</form>
<p class="msg" id="msg"></p>
</body></html>"""


@route("/hr/attendance/kiosk", auth="public", methods=["GET", "POST"])
def hr_attendance_kiosk(request):
    """Check-in/out kiosk - PIN identifies employee (Phase 217)."""
    if request.method == "GET":
        return Response(KIOSK_HTML, content_type="text/html; charset=utf-8")
    pin = (request.form.get("pin") or "").strip()
    action = request.form.get("action", "check_in")
    if not pin:
        return Response(KIOSK_HTML.replace('<p class="msg"', '<p class="msg error">PIN required.</p><p class="msg"'), content_type="text/html; charset=utf-8")
    db = get_session_db(request)
    if not db:
        return Response(KIOSK_HTML.replace('<p class="msg"', '<p class="msg error">Database not configured.</p><p class="msg"'), content_type="text/html; charset=utf-8")
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            from datetime import datetime, timezone
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            Employee = env.get("hr.employee")
            Attendance = env.get("hr.attendance")
            if not Employee or not Attendance:
                return Response(KIOSK_HTML.replace('<p class="msg"', '<p class="msg error">HR not configured.</p><p class="msg"'), content_type="text/html; charset=utf-8")
            employees = Employee.search_read([], ["id", "name"], limit=500)
            emp = next((e for e in employees if str(e.get("id")) == pin or (e.get("name") or "").lower() == pin.lower()), None)
            if not emp:
                return Response(KIOSK_HTML.replace('<p class="msg"', '<p class="msg error">Employee not found.</p><p class="msg"'), content_type="text/html; charset=utf-8")
            now = datetime.now(timezone.utc).isoformat()
            if action == "check_in":
                Attendance.create({"employee_id": emp["id"], "check_in": now})
                msg = f"Checked in: {emp.get('name', '')}"
            else:
                recs = Attendance.search_read([("employee_id", "=", emp["id"]), ("check_out", "=", False)], ["id"], limit=1)
                if recs:
                    Attendance.browse(recs[0]["id"]).write({"check_out": now})
                    msg = f"Checked out: {emp.get('name', '')}"
                else:
                    msg = "No open check-in found."
            return Response(KIOSK_HTML.replace('<p class="msg" id="msg"></p>', f'<p class="msg" id="msg">{msg}</p>'), content_type="text/html; charset=utf-8")
    except Exception as e:
        return Response(KIOSK_HTML.replace('<p class="msg"', f'<p class="msg error">{str(e)}</p><p class="msg"'), content_type="text/html; charset=utf-8")
