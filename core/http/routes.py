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
</div>
</body>
</html>"""


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
    return Response(
        json.dumps({"uid": uid, "db": db}),
        content_type="application/json",
    )


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
    """Serve web client shell. Redirect to login if not authenticated."""
    if get_session_uid(request) is None:
        return redirect("/web/login")
    return Response(
        _webclient_html(debug_assets=_is_debug_assets(request)),
        content_type="text/html; charset=utf-8",
    )
