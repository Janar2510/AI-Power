"""Phase 217: Job application form on website."""

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.http.controller import route
from core.http.auth import get_session_db, _get_registry
from core.sql_db import get_cursor


APPLY_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Apply - {job_name}</title>
<style>
body{{font-family:system-ui;max-width:500px;margin:4rem auto;padding:2rem}}
input,textarea{{width:100%;padding:0.5rem;margin:0.5rem 0}}</style></head><body>
<h1>Apply for {job_name}</h1>
<form method="post">
<input name="name" placeholder="Name" required/>
<input name="email" type="email" placeholder="Email" required/>
<input name="phone" placeholder="Phone"/>
<textarea name="message" placeholder="Message" rows="4"></textarea>
<button type="submit">Submit</button>
</form>
<p><a href="/website">Back</a></p>
</body></html>"""


@route("/jobs/<int:job_id>/apply", auth="public", methods=["GET", "POST"])
def jobs_apply(request, job_id):
    """Application form for job (Phase 217)."""
    db = get_session_db(request)
    if not db:
        return Response("<h1>Apply</h1><p>Database not configured.</p>", content_type="text/html; charset=utf-8")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        from core.orm import Environment
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Job = env.get("hr.job")
        Applicant = env.get("hr.applicant")
        if not Job or not Applicant:
            return Response("<h1>Apply</h1><p>Recruitment not available.</p>", content_type="text/html; charset=utf-8")
        jobs = Job.search_read([("id", "=", job_id)], ["id", "name"])
        if not jobs:
            return Response("<h1>Apply</h1><p>Job not found.</p>", content_type="text/html; charset=utf-8")
        job_name = (jobs[0].get("name") or "Position").replace("<", "&lt;")
    if request.method == "GET":
        return Response(APPLY_HTML.format(job_name=job_name), content_type="text/html; charset=utf-8")
    name = (request.form.get("name") or "").strip()
    email = (request.form.get("email") or "").strip()
    phone = (request.form.get("phone") or "").strip()
    message = (request.form.get("message") or "").strip()
    if not name or not email:
        return Response(APPLY_HTML.format(job_name=job_name) + "<p style='color:red'>Name and email required.</p>", content_type="text/html; charset=utf-8")
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        Applicant = env["hr.applicant"]
        stage = env["hr.recruitment.stage"].search_read([], ["id"], limit=1)
        stage_id = stage[0]["id"] if stage else None
        Applicant.create({
            "name": f"Application: {name}",
            "email": email,
            "phone": phone,
            "job_id": job_id,
            "stage_id": stage_id,
            "kanban_state": "normal",
        })
    return redirect("/website?applied=1")
