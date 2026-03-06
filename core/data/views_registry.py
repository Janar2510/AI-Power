"""Views registry - aggregated views, actions, menus from module data or DB."""

import json
from typing import Any, Dict, List, Optional

from core.tools import config

from .xml_loader import load_xml_data


def load_views_registry_from_db(env: Any) -> Dict[str, Any]:
    """
    Load views from DB when ir.ui.view table exists and has data;
    actions and menus from DB (persistent).
    Falls back to XML when DB tables are empty.
    Returns same structure as load_views_registry.
    """
    reg = load_views_registry()
    try:
        cr = getattr(env, "cr", None)
        if cr:
            cr.execute(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'ir_ui_view'",
            )
            if cr.fetchone():
                rows = env.get("ir.ui.view").search_read(
                    [], ["xml_id", "name", "model", "type", "arch", "priority"]
                )
                if rows:
                    views: Dict[str, List[Dict]] = {}
                    for r in rows:
                        model = r.get("model", "")
                        if not model:
                            continue
                        arch_str = r.get("arch") or "{}"
                        try:
                            arch_dict = json.loads(arch_str)
                        except Exception:
                            arch_dict = {"type": r.get("type", "list"), "columns": [], "fields": []}
                        view_def = {
                            "id": r.get("xml_id") or f"__{r.get('id')}",
                            "model": model,
                            "name": r.get("name", ""),
                            "type": r.get("type", "list"),
                            "columns": arch_dict.get("columns", []),
                            "fields": arch_dict.get("fields", []),
                            "default_group_by": arch_dict.get("default_group_by", ""),
                            "search_fields": arch_dict.get("search_fields", []),
                        }
                        views.setdefault(model, []).append(view_def)
                    reg["views"] = views
    except Exception:
        pass
    ActWindow = env.get("ir.actions.act_window")
    Menu = env.get("ir.ui.menu")
    if ActWindow:
        try:
            rows = ActWindow.search_read([], ["xml_id", "name", "res_model", "view_mode", "context", "domain"])
            if rows:
                actions: Dict[str, Dict] = {}
                for r in rows:
                    xid = r.get("xml_id") or f"__{r.get('id')}"
                    view_mode = r.get("view_mode", "list,form")
                    if isinstance(view_mode, str):
                        view_mode = [x.strip() for x in view_mode.split(",") if x.strip()] or ["list", "form"]
                    actions[xid] = {
                        "id": xid,
                        "name": r.get("name", ""),
                        "res_model": r.get("res_model", ""),
                        "view_mode": view_mode,
                        "context": r.get("context", "") or "",
                        "domain": r.get("domain", "") or "",
                        "type": "ir.actions.act_window",
                    }
                reg["actions"] = actions
        except Exception:
            pass
    if Menu:
        try:
            rows = Menu.search_read(
                [], ["xml_id", "name", "action_ref", "parent_ref", "sequence", "groups_ref"]
            )
            if rows:
                from core.orm.security import get_user_groups
                db = getattr(getattr(env, "registry", None), "db_name", "") or ""
                uid = getattr(env, "uid", 1)
                registry = getattr(env, "registry", None)
                user_groups = get_user_groups(registry, db, uid) if db and registry else set()
                menus_filtered: List[Dict] = []
                for r in rows:
                    groups_ref = (r.get("groups_ref") or "").strip()
                    if groups_ref:
                        allowed = [g.strip() for g in groups_ref.split(",") if g.strip()]
                        if allowed and not (user_groups & set(allowed)):
                            continue
                    menus_filtered.append({
                        "id": r.get("xml_id") or f"__{r.get('id')}",
                        "name": r.get("name", ""),
                        "action": r.get("action_ref", ""),
                        "parent": r.get("parent_ref", ""),
                        "sequence": r.get("sequence", 10),
                    })
                reg["menus"] = menus_filtered
        except Exception:
            pass
    return reg

# Module -> [(rel_path, in_data)]
_DATA_PATHS: Dict[str, List[str]] = {}


def _get_data_files(module_name: str) -> List[str]:
    """Get data file paths from manifest."""
    from core.modules.module import get_manifest
    try:
        m = get_manifest(module_name)
        return m.get("data", []) or []
    except Exception:
        return []


def load_views_registry(loaded_modules: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Load views, actions, menus from all module data files.
    Returns { views: {model: [view_def]}, actions: {id: action_def}, menus: [menu_def] }
    """
    if loaded_modules is None:
        loaded_modules = config.get_config().get("server_wide_modules", ["base", "web"])
    from core.modules.module import resolve_load_order
    order = resolve_load_order(loaded_modules)

    views: Dict[str, List[Dict]] = {}  # model -> [view]
    actions: Dict[str, Dict] = {}  # xml_id -> action
    menus: List[Dict] = []
    id_map: Dict[str, str] = {}

    for module in order:
        for rel_path in _get_data_files(module):
            if not rel_path.endswith(".xml"):
                continue
            records = load_xml_data(module, rel_path)
            for r in records:
                model = r.get("_model", "")
                xml_id = r.get("_id", r.get("id", ""))
                full_id = f"{module}.{xml_id}" if xml_id and "." not in xml_id else xml_id
                if not full_id:
                    full_id = f"{module}.{len(actions) + len(menus)}"

                if model == "ir.ui.view":
                    m = r.get("model", "").strip()
                    if m:
                        arch = r.get("arch", {})
                        view_type = arch.get("type", "list") if isinstance(arch, dict) else "list"
                        cols = arch.get("columns", []) if isinstance(arch, dict) else []
                        flds = arch.get("fields", []) if isinstance(arch, dict) else []
                        search_fields = arch.get("search_fields", []) if isinstance(arch, dict) else []
                        if view_type == "kanban" and not cols:
                            flds = arch.get("fields", []) if isinstance(arch, dict) else []
                        view_def = {
                            "id": full_id,
                            "model": m,
                            "name": r.get("name", ""),
                            "type": view_type,
                            "columns": cols,
                            "fields": flds,
                            "default_group_by": arch.get("default_group_by", "") if isinstance(arch, dict) else "",
                            "search_fields": search_fields,
                        }
                        views.setdefault(m, []).append(view_def)
                        id_map[full_id] = full_id

                elif model == "ir.actions.act_window":
                    actions[full_id] = {
                        "id": full_id,
                        "name": r.get("name", ""),
                        "res_model": r.get("res_model", ""),
                        "view_mode": (r.get("view_mode") or "list,form").split(","),
                        "context": r.get("context", "") or "",
                        "domain": r.get("domain", "") or "",
                        "type": "ir.actions.act_window",
                    }
                    id_map[full_id] = full_id

                elif model == "ir.ui.menu":
                    action_ref = r.get("action", "")
                    if action_ref and "." not in str(action_ref):
                        action_ref = f"{module}.{action_ref}"
                    parent = r.get("parent", "")
                    if parent and "." not in str(parent):
                        parent = f"{module}.{parent}"
                    menus.append({
                        "id": full_id,
                        "name": r.get("name", ""),
                        "action": action_ref,
                        "parent": parent,
                        "sequence": r.get("sequence", 10),
                    })

    return {"views": views, "actions": actions, "menus": menus}


def get_view_for_model(model: str, view_type: str, registry: Dict) -> Optional[Dict]:
    """Get view definition for model and type (list/form)."""
    views = registry.get("views", {}).get(model, [])
    for v in views:
        if v.get("type") == view_type:
            return v
    return None
