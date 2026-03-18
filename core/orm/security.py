"""Security - access rights from ir.model.access.csv."""

import csv
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

AccessEntry = Tuple[str, str, bool, bool, bool, bool]  # model, group, r, w, c, u


def parse_ir_model_access_csv(content: str) -> List[AccessEntry]:
    """Parse ir.model.access.csv content. Returns list of (model, group, r, w, c, u)."""
    if content is None:
        return []
    entries = []
    reader = csv.DictReader(
        [line for line in content.splitlines() if line.strip()],
        fieldnames=["id", "name", "model_id:id", "group_id:id", "perm_read", "perm_write", "perm_create", "perm_unlink"],
    )
    for row in reader:
        model_id = row.get("model_id:id") or ""
        if model_id and str(model_id).startswith("model_"):
            model = str(model_id).replace("model_", "").replace("_", ".")
            group = row.get("group_id:id") or ""
            r = row.get("perm_read", "0") == "1"
            w = row.get("perm_write", "0") == "1"
            c = row.get("perm_create", "0") == "1"
            u = row.get("perm_unlink", "0") == "1"
            entries.append((model, group, r, w, c, u))
    return entries


def load_access_from_module(module_path: Path) -> List[AccessEntry]:
    """Load access rights from module's security/ir.model.access.csv."""
    csv_path = module_path / "security" / "ir.model.access.csv"
    if not csv_path.exists():
        return []
    return parse_ir_model_access_csv(csv_path.read_text(encoding="utf-8"))


def check_access(
    access_map: Dict[str, List[Tuple[str, str]]],
    model_name: str,
    operation: str,
    user_groups: Optional[Set[str]] = None,
) -> bool:
    """
    Check if user has access. access_map: model -> [(group, op), ...].
    Empty group means all users. Default-allow if no entry (MVP backward compat).
    """
    if model_name is None or not str(model_name).strip():
        return True
    if model_name not in access_map:
        return True  # No rules = allow (MVP)
    user_groups = user_groups or set()
    for group, op in access_map[model_name]:
        if op == operation and (not group or group in user_groups):
            return True
    return False


# Record rules: model -> list of parsed rule specs
_RECORD_RULES: Dict[str, List[Dict[str, Any]]] = {}


def load_record_rules(addons_paths: List[Path]) -> Dict[str, List[Dict[str, Any]]]:
    """Load ir.rule from security/ir_rule.xml."""
    result: Dict[str, List[Dict[str, Any]]] = {}
    for addons_dir in addons_paths:
        if not addons_dir.exists():
            continue
        for entry in addons_dir.iterdir():
            if not entry.is_dir():
                continue
            xml_path = entry / "security" / "ir_rule.xml"
            if not xml_path.exists():
                continue
            try:
                import xml.etree.ElementTree as ET
                tree = ET.parse(xml_path)
                for rec in tree.getroot().findall(".//{*}record"):
                    if rec.get("model") != "ir.rule":
                        continue
                    model_ref = None
                    domain_force = ""
                    groups_ref = ""
                    active = True
                    perm_read = True
                    perm_write = True
                    perm_create = True
                    perm_unlink = True
                    for f in rec.findall("{*}field"):
                        name = f.get("name")
                        if name == "model_id":
                            model_ref = (f.text or "").strip()
                            if model_ref and model_ref.startswith("model_"):
                                model_ref = model_ref.replace("model_", "").replace("_", ".")
                        elif name == "domain_force":
                            domain_force = (f.text or "").strip()
                        elif name in ("groups", "groups_ref"):
                            groups_ref = (f.text or "").strip()
                        elif name == "active":
                            active = (f.text or "").strip() not in ("0", "false", "False")
                        elif name == "perm_read":
                            perm_read = (f.text or "").strip() not in ("0", "false", "False")
                        elif name == "perm_write":
                            perm_write = (f.text or "").strip() not in ("0", "false", "False")
                        elif name == "perm_create":
                            perm_create = (f.text or "").strip() not in ("0", "false", "False")
                        elif name == "perm_unlink":
                            perm_unlink = (f.text or "").strip() not in ("0", "false", "False")
                    if model_ref and domain_force:
                        result.setdefault(model_ref, []).append({
                            "domain_force": domain_force,
                            "groups_ref": groups_ref,
                            "active": active,
                            "perm_read": perm_read,
                            "perm_write": perm_write,
                            "perm_create": perm_create,
                            "perm_unlink": perm_unlink,
                        })
            except Exception:
                pass
    return result


def _get_company_ids(env: Any, uid: int) -> List:
    """Get allowed company IDs for user (for ir.rule domain substitution)."""
    if not env or not uid:
        return []
    try:
        User = env.get("res.users")
        if not User:
            return []
        rows = User.read_ids([uid], ["company_ids", "company_id"])
        if not rows:
            return []
        r = rows[0]
        company_ids = r.get("company_ids") or []
        if not company_ids and r.get("company_id"):
            company_ids = [r["company_id"]]
        return company_ids if isinstance(company_ids, list) else list(company_ids)
    except Exception:
        return []


def _get_partner_id(env: Any, uid: int):
    """Get partner_id for user (Phase 101: portal record rules)."""
    if not env or not uid:
        return None
    try:
        User = env.get("res.users")
        if not User:
            return None
        rows = User.read_ids([uid], ["partner_id"])
        if not rows:
            return None
        return rows[0].get("partner_id")
    except Exception:
        return None


def get_record_rules(model_name: str, uid: int, env: Any = None, operation: str = "read") -> List[List]:
    """Get record rule domains for model. Substitute uid and company_ids in domain.
    When env has ir.rule, read from DB; otherwise fallback to XML.
    Phase 101: portal users get partner_id restriction for crm.lead.
    Phase 219: when env.su is True, bypass record rules (return [])."""
    if env and getattr(env, "su", False):
        return []
    company_ids = _get_company_ids(env, uid) if env and uid else []
    if env and model_name != "ir.rule":
        try:
            cr = getattr(env, "cr", None)
            if cr:
                cr.execute(
                    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ir_rule'",
                )
                if cr.fetchone():
                    cr.execute(
                        "SELECT domain_force, groups_ref, active, perm_read, perm_write, perm_create, perm_unlink "
                        "FROM ir_rule WHERE model = %s",
                        (model_name,),
                    )
                    rows = cr.fetchall()
                    if rows:
                        out = []
                        user_groups = get_user_groups(env.registry, getattr(env.registry, "db_name", ""), uid, env=env) if env and uid else set()
                        for row in rows:
                            spec = _row_to_rule_spec(row)
                            if not _rule_applies(spec, operation, user_groups):
                                continue
                            domain_force = spec.get("domain_force") or ""
                            domain = _parse_domain_force(domain_force or "", uid, company_ids, env=env)
                            if domain:
                                out.append(domain)
                        if model_name == "crm.lead" and env and uid:
                            try:
                                db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
                                if db and _user_has_group(env, uid, "base.group_portal"):
                                    partner_id = _get_partner_id(env, uid)
                                    if partner_id:
                                        out.append([["partner_id", "=", partner_id]])
                            except Exception:
                                pass
                        if model_name == "sale.order" and env and uid:
                            try:
                                db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
                                if db and _user_has_group(env, uid, "base.group_portal"):
                                    partner_id = _get_partner_id(env, uid)
                                    if partner_id:
                                        out.append([["partner_id", "=", partner_id]])
                            except Exception:
                                pass
                        if model_name in ("mail.message", "mail.activity", "ir.attachment") and env and uid:
                            try:
                                db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
                                if db and _user_has_group(env, uid, "base.group_portal"):
                                    partner_id = _get_partner_id(env, uid)
                                    if partner_id:
                                        Lead = env.get("crm.lead")
                                        if Lead:
                                            lead_ids = Lead.search([("partner_id", "=", partner_id)]).ids
                                            if lead_ids:
                                                out.append([["res_model", "=", "crm.lead"], ["res_id", "in", lead_ids]])
                            except Exception:
                                pass
                        return out
        except Exception:
            cr = getattr(env, "cr", None)
            if cr:
                try:
                    cr.rollback()
                except Exception:
                    pass
    global _RECORD_RULES
    if not _RECORD_RULES:
        from core.tools import config
        _RECORD_RULES = load_record_rules(config.get_addons_paths())
    rules = _RECORD_RULES.get(model_name, [])
    out = []
    user_groups = get_user_groups(env.registry, getattr(env.registry, "db_name", ""), uid, env=env) if env and uid else set()
    for spec in rules:
        if not _rule_applies(spec, operation, user_groups):
            continue
        domain = _parse_domain_force(str(spec.get("domain_force") or ""), uid, company_ids, env=env)
        if domain:
            out.append(domain)
    # Phase 101: portal users see only crm.lead where partner_id = their partner
    if model_name == "crm.lead" and env and uid:
        try:
            db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
            if db and _user_has_group(env, uid, "base.group_portal"):
                partner_id = _get_partner_id(env, uid)
                if partner_id:
                    out.append([["partner_id", "=", partner_id]])
        except Exception:
            pass
    # Phase 157: portal users see only account.move (out_invoice) where partner_id = their partner
    if model_name == "account.move" and env and uid:
        try:
            db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
            if db and _user_has_group(env, uid, "base.group_portal"):
                partner_id = _get_partner_id(env, uid)
                if partner_id:
                    out.append([["move_type", "=", "out_invoice"], ["partner_id", "=", partner_id]])
        except Exception:
            pass
    # Phase 143: portal users see only sale.order where partner_id = their partner
    if model_name == "sale.order" and env and uid:
        try:
            db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
            if db and _user_has_group(env, uid, "base.group_portal"):
                partner_id = _get_partner_id(env, uid)
                if partner_id:
                    out.append([["partner_id", "=", partner_id]])
        except Exception:
            pass
    # Phase 111: portal users can read mail.message/mail.activity/ir.attachment for their leads
    if model_name in ("mail.message", "mail.activity", "ir.attachment") and env and uid:
        try:
            db = getattr(env.registry, "db_name", None) if hasattr(env, "registry") else None
            if db and _user_has_group(env, uid, "base.group_portal"):
                partner_id = _get_partner_id(env, uid)
                if partner_id:
                    Lead = env.get("crm.lead")
                    if Lead:
                        lead_ids = Lead.search([("partner_id", "=", partner_id)]).ids
                        if lead_ids:
                            out.append([["res_model", "=", "crm.lead"], ["res_id", "in", lead_ids]])
        except Exception:
            pass
    return out


def _row_to_rule_spec(row: Any) -> Dict[str, Any]:
    """Normalize DB result row into a rule spec dict."""
    if isinstance(row, dict):
        return {
            "domain_force": row.get("domain_force", ""),
            "groups_ref": row.get("groups_ref", "") or "",
            "active": row.get("active", True) is not False,
            "perm_read": row.get("perm_read", True) is not False,
            "perm_write": row.get("perm_write", True) is not False,
            "perm_create": row.get("perm_create", True) is not False,
            "perm_unlink": row.get("perm_unlink", True) is not False,
        }
    vals = list(row or [])
    while len(vals) < 7:
        vals.append(True if len(vals) >= 2 else "")
    return {
        "domain_force": vals[0] or "",
        "groups_ref": vals[1] or "",
        "active": vals[2] is not False,
        "perm_read": vals[3] is not False,
        "perm_write": vals[4] is not False,
        "perm_create": vals[5] is not False,
        "perm_unlink": vals[6] is not False,
    }


def _rule_applies(rule: Dict[str, Any], operation: str, user_groups: Optional[Set[str]] = None) -> bool:
    """Return True if rule is active and applies to operation/user groups."""
    if not rule or rule.get("active") is False:
        return False
    flag_by_op = {
        "read": "perm_read",
        "write": "perm_write",
        "create": "perm_create",
        "unlink": "perm_unlink",
    }
    flag_name = flag_by_op.get(operation, "perm_read")
    if rule.get(flag_name) is False:
        return False
    groups_ref = str(rule.get("groups_ref") or "").strip()
    if not groups_ref:
        return True
    wanted = {g.strip() for g in groups_ref.split(",") if g.strip()}
    return bool((user_groups or set()) & wanted)


def _user_has_group(env: Any, uid: int, group_full_name: str) -> bool:
    """Check if user has the given group (Phase 101)."""
    if not env or not uid or not group_full_name:
        return False
    try:
        db = getattr(getattr(env, "registry", None), "db_name", None)
        if not db:
            return False
        groups = get_user_groups(env.registry, db, uid, env=env)
        return group_full_name in groups
    except Exception:
        return False


def _parse_domain_force(text: str, uid: int, company_ids: Optional[List] = None, env: Any = None) -> List:
    """Parse domain_force string. Eval with uid and company_ids in scope."""
    if not text or not text.strip():
        return []
    company_ids = company_ids if company_ids is not None else []
    partner_id = _get_partner_id(env, uid) if env and uid else None
    safe_globals = {"uid": uid, "company_ids": company_ids, "partner_id": partner_id}
    try:
        domain = eval(text.strip(), {"__builtins__": {}}, safe_globals)
        if isinstance(domain, (list, tuple)):
            return list(domain)
    except Exception:
        pass
    return []


def _substitute_in_domain(domain: List, uid: int, company_ids: Optional[List] = None) -> List:
    """Substitute uid and company_ids in domain terms."""
    company_ids = company_ids if company_ids is not None else []
    out = []
    for term in domain:
        if isinstance(term, (list, tuple)) and len(term) >= 3:
            val = term[2]
            if val == "uid" or (isinstance(val, str) and val == "uid"):
                val = uid
            elif val == "company_ids" or (isinstance(val, str) and "company_ids" in str(val)):
                val = company_ids
            out.append([term[0], term[1], val])
        else:
            out.append(term)
    return out


def get_user_groups(registry: Any, db: str, uid: int, env: Any = None) -> Set[str]:
    """Return set of group full_name (xml_id) for user. Used by check_access.
    Phase 107: if env with valid cr is passed, use it (same transaction); else open new cursor."""
    if not uid or not registry or not db:
        return set()
    try:
        use_env = env if (env and hasattr(env, "cr") and env.cr) else None
        if use_env is None:
            from core.sql_db import get_cursor
            from core.orm import Environment
            with get_cursor(db) as cr:
                use_env = Environment(registry, cr=cr, uid=uid)
                registry.set_env(use_env)
                return _read_user_groups(registry, uid)
        return _read_user_groups(registry, uid)
    except Exception:
        return set()


def _read_user_groups(registry: Any, uid: int) -> Set[str]:
    """Read group full_names for user from registry._env."""
    User = registry.get("res.users") if hasattr(registry, "get") else None
    Groups = registry.get("res.groups") if hasattr(registry, "get") else None
    if not User or not Groups:
        return set()
    rows = User.read_ids([uid], ["group_ids"])
    if not rows or not rows[0].get("group_ids"):
        return set()
    gids = rows[0]["group_ids"]
    if not gids:
        return set()
    group_rows = Groups.read_ids(gids, ["full_name"])
    return {r.get("full_name") for r in group_rows if r.get("full_name")}


def build_access_map(addons_paths: List[Path]) -> Dict[str, List[Tuple[str, str]]]:
    """Build model -> [(group, op), ...] from all module security CSVs."""
    result: Dict[str, List[Tuple[str, str]]] = {}
    for addons_dir in addons_paths:
        if not addons_dir.exists():
            continue
        for entry in addons_dir.iterdir():
            if entry.is_dir():
                for model, group, r, w, c, u in load_access_from_module(entry):
                    if model not in result:
                        result[model] = []
                    if r:
                        result[model].append((group, "read"))
                    if w:
                        result[model].append((group, "write"))
                    if c:
                        result[model].append((group, "create"))
                    if u:
                        result[model].append((group, "unlink"))
    return result
