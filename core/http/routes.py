"""Default routes - web client root and login."""

from werkzeug.wrappers import Response
from werkzeug.utils import redirect

from core.tools import config
from core.modules.assets import get_bundle_urls
from core.http.controller import route
from core.http.request import Request


def _is_debug_assets(request: Request) -> bool:
    """Check if debug=assets mode (individual files, no minification)."""
    if request.args.get("debug") == "assets":
        return True
    return config.get_config().get("debug_assets", False)
from core.http.auth import (
    authenticate,
    get_session_uid,
    get_session_db,
    get_session_company_id_from_request,
    get_session_lang_from_request,
    set_session_company_id,
    set_session_lang,
    get_session,
    login_response_with_html,
    logout_response,
    _get_registry,
)
from core.sql_db import db_exists, get_cursor


LOGIN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ERP Platform - Login</title>
<link rel="stylesheet" href="/web/static/src/scss/webclient.css"/>
<style>
  body {{ margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }}
  .login-box {{ max-width: 320px; margin: 4rem auto; padding: 2rem; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
  .login-box h1 {{ margin-top: 0; }}
  .login-box input {{ width: 100%; padding: 0.5rem; margin: 0.5rem 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }}
  .login-box button {{ width: 100%; padding: 0.75rem; margin-top: 0.5rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }}
  .login-box .error {{ color: #c00; font-size: 0.9rem; }}
</style>
</head>
<body>
<div class="login-box">
  <h1>ERP Platform</h1>
  <form method="post" action="/web/login">
    <input type="text" name="login" placeholder="Login" required autofocus/>
    <input type="password" name="password" placeholder="Password" required/>
    <input type="hidden" name="db" value="{db}"/>
    <button type="submit">Log in</button>
  </form>
  <p class="error">{error}</p>
  <a href="/web/signup?db={db}">Create an account</a>
</div>
</body>
</html>"""


@route("/health", auth="public", methods=["GET"])
def health(request):
    """Health check endpoint for load balancers and monitoring (Phase 99)."""
    import json
    db = request.args.get("db", config.get_config().get("db_name", "erp"))
    db_ok = db_exists(db)
    try:
        body = json.dumps({"status": "ok", "db": db_ok})
    except Exception:
        body = '{"status":"ok","db":false}'
    return Response(body, content_type="application/json")


@route("/web/login", auth="public", methods=["GET", "POST"])
def login(request):
    """Login page - GET shows form, POST authenticates."""
    if request.method == "POST":
        login_name = request.form.get("login", "").strip()
        password = request.form.get("password", "")
        db = request.form.get("db", "erp")
        if not db_exists(db):
            return Response(
                LOGIN_HTML.format(db=db, error=f"Database {db} does not exist. Run: erp-bin db init -d {db}"),
                content_type="text/html; charset=utf-8",
                status=400,
            )
        uid = authenticate(login_name, password, db)
        if uid:
            return login_response_with_html(
                uid, db, _webclient_html(debug_assets=_is_debug_assets(request))
            )
        return Response(
            LOGIN_HTML.format(db=db, error="Invalid login or password."),
            content_type="text/html; charset=utf-8",
            status=401,
        )
    db = request.args.get("db", "erp")
    return Response(
        LOGIN_HTML.format(db=db, error=""),
        content_type="text/html; charset=utf-8",
    )


@route("/web/logout", auth="public", methods=["GET"])
def logout(request):
    """Logout - clear session."""
    return logout_response()


SIGNUP_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ERP Platform - Sign up</title>
<link rel="stylesheet" href="/web/static/src/scss/webclient.css"/>
<style>
  body {{ margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }}
  .signup-box {{ max-width: 320px; margin: 4rem auto; padding: 2rem; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
  .signup-box h1 {{ margin-top: 0; }}
  .signup-box input {{ width: 100%; padding: 0.5rem; margin: 0.5rem 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }}
  .signup-box button {{ width: 100%; padding: 0.75rem; margin-top: 0.5rem; background: #1a1a2e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }}
  .signup-box .error {{ color: #c00; font-size: 0.9rem; }}
  .signup-box .success {{ color: #080; font-size: 0.9rem; }}
  .signup-box a {{ margin-top: 1rem; display: block; text-align: center; }}
</style>
</head>
<body>
<div class="signup-box">
  <h1>Sign up</h1>
  <form method="post" action="/web/signup">
    <input type="text" name="name" placeholder="Full name" required/>
    <input type="hidden" name="db" value="{db}"/>
    <input type="email" name="email" placeholder="Email" required/>
    <input type="text" name="login" placeholder="Login (username)" required/>
    <input type="password" name="password" placeholder="Password" required/>
    <button type="submit">Create account</button>
  </form>
  <p class="error">{error}</p>
  <p class="success">{success}</p>
  <a href="/web/login">Already have an account? Log in</a>
</div>
</body>
</html>"""


@route("/web/signup", auth="public", methods=["GET", "POST"])
def signup(request):
    """Signup page - GET shows form, POST creates portal user (Phase 98)."""
    db = request.form.get("db", request.args.get("db", "erp")) if request.method == "POST" else request.args.get("db", "erp")
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip()
        login_name = (request.form.get("login") or "").strip()
        password = request.form.get("password", "")
        if not name or not login_name or not password:
            return Response(
                SIGNUP_HTML.format(db=db, error="Name, login and password are required.", success=""),
                content_type="text/html; charset=utf-8",
                status=400,
            )
        if not db_exists(db):
            return Response(
                SIGNUP_HTML.format(db=db, error=f"Database {db} does not exist.", success=""),
                content_type="text/html; charset=utf-8",
                status=400,
            )
        try:
            with get_cursor(db) as cr:
                from core.orm import Environment
                registry = _get_registry(db)
                env = Environment(registry, cr=cr, uid=1)
                registry.set_env(env)
                User = env.get("res.users")
                uid = User._create_portal_user(env, name=name, login=login_name, password=password, email=email or None)
                if uid:
                    return Response(
                        SIGNUP_HTML.format(db=db, error="", success="Account created. You can now log in."),
                        content_type="text/html; charset=utf-8",
                    )
        except Exception as e:
            pass
        return Response(
            SIGNUP_HTML.format(db=db, error="Signup failed. Login may already exist.", success=""),
            content_type="text/html; charset=utf-8",
            status=400,
        )
    return Response(
        SIGNUP_HTML.format(db=db, error="", success=""),
        content_type="text/html; charset=utf-8",
    )


@route("/web/load_views", auth="user", methods=["GET"])
def load_views(request):
    """Return views, actions, menus from DB (persistent) when session exists, else XML."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    import json
    from core.orm import Environment
    from core.data.views_registry import load_views_registry, load_views_registry_from_db

    db = get_session_db(request)
    try:
        registry_obj = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry_obj, cr=cr, uid=uid)
            registry_obj.set_env(env)
            registry = load_views_registry_from_db(env)
            fields_meta = {}
            for model_name in list(registry.get("views", {}).keys()):
                ModelCls = env.get(model_name)
                if ModelCls and hasattr(ModelCls, "fields_get"):
                    try:
                        fields_meta[model_name] = ModelCls.fields_get()
                    except Exception:
                        try:
                            cr.connection.rollback()
                        except Exception:
                            pass
            registry["fields_meta"] = fields_meta
    except Exception:
        registry = load_views_registry()
    return Response(
        json.dumps(registry),
        content_type="application/json",
    )


@route("/web/session/get_session_info", auth="public", methods=["POST"])
def get_session_info(request):
    """Return session info if valid. Used by frontend to verify cookie is working."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(
            '{"error": "no session"}',
            content_type="application/json",
            status=401,
        )
    import json
    result = {"uid": uid, "db": db, "lang": get_session_lang_from_request(request)}
    # Phase 90: user_companies for company switcher
    try:
        registry_obj = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry_obj, cr=cr, uid=uid)
            registry_obj.set_env(env)
            User = env["res.users"]
            Company = env.get("res.company")
            rows = User.read_ids([uid], ["company_id", "company_ids"])
            company_ids = []
            if rows:
                company_ids = rows[0].get("company_ids") or []
                if not company_ids and rows[0].get("company_id"):
                    company_ids = [rows[0]["company_id"]]
            current_id = get_session_company_id_from_request(request)
            if not current_id and company_ids:
                current_id = company_ids[0]
            allowed = []
            if Company and company_ids:
                comp_rows = Company.read_ids(company_ids, ["id", "name"])
                for r in comp_rows:
                    allowed.append({"id": r["id"], "name": r.get("name", "")})
            result["user_companies"] = {
                "current_company": next((a for a in allowed if a["id"] == current_id), allowed[0] if allowed else None),
                "allowed_companies": allowed,
            }
    except Exception:
        result["user_companies"] = {"current_company": None, "allowed_companies": []}
    try:
        registry_obj = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry_obj, cr=cr, uid=uid)
            Lang = env.get("res.lang")
        if Lang:
            rows = Lang.search_read([["active", "=", True]], ["code", "name"], order="name")
            result["user_langs"] = [{"code": r.get("code"), "name": r.get("name")} for r in (rows or [])]
        else:
            result["user_langs"] = [{"code": "en_US", "name": "English"}]
    except Exception:
        result["user_langs"] = [{"code": "en_US", "name": "English"}]
    # Phase 101: user groups for portal detection
    try:
        from core.orm.security import get_user_groups
        registry_obj = _get_registry(db)
        result["groups"] = list(get_user_groups(registry_obj, db, uid))
    except Exception:
        result["groups"] = []
    return Response(
        json.dumps(result),
        content_type="application/json",
    )


@route("/web/translations", auth="user", methods=["GET"])
def get_translations(request):
    """Return translation catalog for session language (Phase 94)."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    import json
    lang = request.args.get("lang") or get_session_lang_from_request(request)
    try:
        registry_obj = _get_registry(get_session_db(request))
        with get_cursor(get_session_db(request)) as cr:
            from core.orm import Environment
            env = Environment(registry_obj, cr=cr, uid=uid)
            registry_obj.set_env(env)
            Translation = env.get("ir.translation")
            catalog = {}
            if Translation:
                rows = Translation.search_read([["lang", "=", lang]], ["src", "value"])
                for r in rows:
                    src = (r.get("src") or "").strip()
                    val = (r.get("value") or "").strip()
                    if src and val:
                        catalog[src] = val
        return Response(json.dumps(catalog), content_type="application/json")
    except Exception:
        return Response("{}", content_type="application/json")


@route("/web/session/set_lang", auth="user", methods=["POST"])
def set_lang(request):
    """Set session language. Requires lang in JSON body."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    try:
        data = request.get_json(force=True, silent=True) or {}
        lang = (data.get("lang") or "").strip() or "en_US"
        sid = request.cookies.get("erp_session")
        if not sid or not get_session(sid):
            return Response('{"error": "no session"}', status=401, content_type="application/json")
        set_session_lang(sid, lang)
        return Response('{"ok": true}', content_type="application/json")
    except Exception:
        return Response('{"error": "invalid"}', status=400, content_type="application/json")


@route("/web/session/set_current_company", auth="user", methods=["POST"])
def set_current_company(request):
    """Set current company in session. Requires company_id in JSON body."""
    uid = get_session_uid(request)
    if uid is None:
        return Response('{"error": "unauthorized"}', status=401, content_type="application/json")
    try:
        data = request.get_json(force=True, silent=True) or {}
        company_id = data.get("company_id")
        if company_id is None:
            return Response('{"error": "company_id required"}', status=400, content_type="application/json")
        company_id = int(company_id)
        sid = request.cookies.get("erp_session")
        if not sid or not get_session(sid):
            return Response('{"error": "no session"}', status=401, content_type="application/json")
        db = get_session_db(request)
        registry_obj = _get_registry(db)
        with get_cursor(db) as cr:
            from core.orm import Environment
            env = Environment(registry_obj, cr=cr, uid=uid)
            User = env["res.users"]
            rows = User.read_ids([uid], ["company_ids"])
            allowed = rows[0].get("company_ids") or [] if rows else []
            if company_id not in allowed:
                return Response('{"error": "company not allowed"}', status=403, content_type="application/json")
        set_session_company_id(sid, company_id)
        return Response('{"ok": true}', content_type="application/json")
    except (ValueError, TypeError):
        return Response('{"error": "invalid company_id"}', status=400, content_type="application/json")


def _webclient_html(debug_assets: bool = False) -> str:
    """Web client shell HTML. Use debug_assets=True for individual files (no minification)."""
    if debug_assets:
        urls = get_bundle_urls("web.assets_web")
        css_tags = "\n".join(f'<link rel="stylesheet" href="{u}"/>' for u in urls.get("css", []))
        js_tags = "\n".join(f'<script src="{u}"></script>' for u in urls.get("js", []))
    else:
        css_tags = '<link rel="stylesheet" href="/web/assets/web.assets_web.css"/>'
        js_tags = '<script src="/web/assets/web.assets_web.js"></script>'

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ERP Platform</title>
{css_tags}
<style>
  body {{ margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; color: #333; min-height: 100vh; }}
  #webclient {{ min-height: 100vh; display: flex; flex-direction: column; }}
  #navbar {{ background: #1a1a2e; color: white; padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 1rem; }}
  #navbar a {{ color: white; margin-left: auto; }}
  #main {{ flex: 1; padding: 1rem; }}
</style>
</head>
<body>
<div id="webclient">
  <header id="navbar">
    <span class="logo">ERP Platform</span>
    <nav style="display:flex;gap:1rem;">
      <a href="#home" data-view="home">Home</a>
      <a href="#contacts" data-view="contacts">Contacts</a>
    </nav>
    <a href="/web/logout" style="margin-left:auto;">Logout</a>
  </header>
  <main id="main"><div id="action-manager">Loading...</div></main>
  <div id="toast-container" style="position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" crossorigin="anonymous"></script>
{js_tags}
</body>
</html>"""


@route("/", auth="user", methods=["GET"])
def index(request):
    """Serve web client shell. Redirect to login if not authenticated. Phase 101: portal users -> /my."""
    uid = get_session_uid(request)
    if uid is None:
        return redirect("/web/login")
    db = get_session_db(request)
    try:
        from core.orm.security import get_user_groups
        registry_obj = _get_registry(db)
        groups = get_user_groups(registry_obj, db, uid)
        if "base.group_portal" in groups:
            return redirect("/my")
    except Exception:
        pass
    return Response(
        _webclient_html(debug_assets=_is_debug_assets(request)),
        content_type="text/html; charset=utf-8",
    )
