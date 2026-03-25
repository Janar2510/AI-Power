"""Resolve default company for create() flows from Environment (RPC session / context)."""


def default_company_id_for_env(env) -> int | None:
    """Prefer session ``context.company_id`` (set by JSON-RPC), then user's company, then first company."""
    if not env:
        return None
    ctx = getattr(env, "context", {}) or {}
    cid = ctx.get("company_id")
    if cid is not None:
        if isinstance(cid, (list, tuple)) and cid:
            return int(cid[0]) if cid[0] is not None else None
        try:
            return int(cid)
        except (TypeError, ValueError):
            pass
    uid = getattr(env, "uid", None)
    if uid:
        User = env.get("res.users")
        if User:
            rows = User.read_ids([uid], ["company_id"])
            if rows:
                v = rows[0].get("company_id")
                if isinstance(v, (list, tuple)) and v:
                    return int(v[0])
                if v is not None:
                    try:
                        return int(v)
                    except (TypeError, ValueError):
                        pass
    Company = env.get("res.company")
    if Company:
        companies = Company.search([], limit=1)
        if companies.ids:
            return companies.ids[0]
    return None
