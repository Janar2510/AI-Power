"""Views registry - aggregated views, actions, menus from module data or DB."""

import json
import logging
from typing import Any, Dict, List, Optional

from core.tools import config

from .xml_loader import load_xml_data, _parse_form_child, _form_children_to_flat_fields

_logger = logging.getLogger("erp.views")


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
                        if arch_dict.get("children"):
                            view_def["children"] = arch_dict["children"]
                        if r.get("type") == "graph" and isinstance(arch_dict, dict):
                            view_def["graph_type"] = arch_dict.get("graph_type", "bar")
                            view_def["fields"] = arch_dict.get("fields", [])
                        if r.get("type") == "pivot" and isinstance(arch_dict, dict):
                            view_def["fields"] = arch_dict.get("fields", [])
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
    ActUrl = env.get("ir.actions.act_url")
    if ActUrl:
        try:
            rows = ActUrl.search_read([], ["xml_id", "name", "url", "target"])
            if rows:
                actions = dict(reg.get("actions", {}))
                for r in rows:
                    xid = r.get("xml_id") or f"__{r.get('id')}"
                    actions[xid] = {
                        "id": xid,
                        "name": r.get("name", ""),
                        "res_model": "",
                        "view_mode": [],
                        "context": "",
                        "domain": "",
                        "type": "ir.actions.act_url",
                        "url": r.get("url", ""),
                        "target": r.get("target", "self"),
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
    # Phase 110: report actions from ir.actions.report (model -> report_name)
    Report = env.get("ir.actions.report")
    if Report:
        try:
            rows = Report.search_read([], ["model", "report_name"])
            if rows:
                reports: Dict[str, str] = {}
                for r in rows:
                    model = r.get("model", "")
                    report_name = r.get("report_name", "")
                    if model and report_name:
                        reports[model] = report_name
                reg["reports"] = reports
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
    inherit_pending: List[Dict] = []

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
                    inherit_id_raw = r.get("inherit_id", "")
                    if isinstance(inherit_id_raw, dict) and "_ref" in inherit_id_raw:
                        inherit_id_raw = inherit_id_raw["_ref"]
                    inherit_id = str(inherit_id_raw).strip() if inherit_id_raw else ""
                    if inherit_id and "." not in inherit_id:
                        inherit_id = f"{module}.{inherit_id}"
                    arch = r.get("arch", {})
                    if inherit_id and isinstance(arch, dict) and "_raw_xml" in arch:
                        m = r.get("model", "").strip()
                        if m:
                            inherit_pending.append({
                                "id": full_id,
                                "model": m,
                                "inherit_id": inherit_id,
                                "raw_xml": arch["_raw_xml"],
                            })
                        continue
                    m = r.get("model", "").strip()
                    if m:
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
                        if view_type == "form" and isinstance(arch, dict) and arch.get("children"):
                            view_def["children"] = arch["children"]
                        if view_type == "calendar" and isinstance(arch, dict):
                            view_def["date_start"] = arch.get("date_start", "")
                            view_def["string"] = arch.get("string", "")
                        if view_type == "graph" and isinstance(arch, dict):
                            view_def["graph_type"] = arch.get("graph_type", "bar")
                            view_def["fields"] = arch.get("fields", [])
                        if view_type == "pivot" and isinstance(arch, dict):
                            view_def["fields"] = arch.get("fields", [])
                        if view_type == "search" and isinstance(arch, dict):
                            view_def["filters"] = arch.get("filters", [])
                            view_def["group_bys"] = arch.get("group_bys", [])
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

    # Apply view inheritance (inherit_id + xpath)
    for pending in inherit_pending:
        base_id = pending.get("inherit_id", "")
        model_name = pending.get("model", "")
        raw_xml = pending.get("raw_xml")
        if not base_id or not raw_xml:
            continue
        base_view = None
        for v in views.get(model_name, []):
            if v.get("id") == base_id:
                base_view = v
                break
        if base_view is None:
            _logger.debug("View inheritance: base %s not found", base_id)
            continue
        xpath_ops = _parse_xpath_from_raw_xml(raw_xml)
        if xpath_ops:
            _apply_xpath_ops(base_view, xpath_ops)

    return {"views": views, "actions": actions, "menus": menus}


def _find_node_in_children(children, expr):
    """Find a node in children tree by xpath-like expr.
    Supports: //group[@string='X'], //field[@name='X'], //notebook, //page[@string='X']
    Returns (parent_list, index) or (None, -1).
    """
    import re
    m = re.match(r"//(\w+)(?:\[@(\w+)=['\"]([^'\"]+)['\"]\])?", expr)
    if not m:
        return None, -1
    tag, attr, val = m.group(1), m.group(2), m.group(3)
    return _find_in_list(children, tag, attr, val)


def _find_in_list(items, tag, attr, val):
    """Recursively search children list for matching node."""
    for i, node in enumerate(items):
        if not isinstance(node, dict):
            continue
        ntype = node.get("type", "")
        if ntype == tag or (tag == "field" and ntype == "field"):
            if attr is None:
                return items, i
            node_val = node.get(attr, "") or node.get("string", "")
            if str(node_val) == str(val):
                return items, i
        for key in ("children", "pages"):
            sub = node.get(key)
            if sub and isinstance(sub, list):
                result = _find_in_list(sub, tag, attr, val)
                if result[0] is not None:
                    return result
    return None, -1


def _apply_xpath_ops(base_view, xpath_elements):
    """Apply xpath operations from inheritance view onto base view arch."""
    children = base_view.get("children")
    if children is None:
        return
    for xp in xpath_elements:
        expr = xp.get("expr", "")
        position = xp.get("position", "inside")
        new_nodes = xp.get("nodes", [])
        if not expr:
            continue
        parent_list, idx = _find_node_in_children(children, expr)
        if parent_list is None:
            _logger.debug("xpath expr=%s not found in view", expr)
            continue
        if position == "inside":
            target = parent_list[idx]
            target_children = target.get("children")
            if target_children is None:
                target_children = target.get("pages")
            if target_children is not None:
                target_children.extend(new_nodes)
        elif position == "after":
            for j, n in enumerate(new_nodes):
                parent_list.insert(idx + 1 + j, n)
        elif position == "before":
            for j, n in enumerate(new_nodes):
                parent_list.insert(idx + j, n)
        elif position == "replace":
            parent_list[idx:idx + 1] = new_nodes
        elif position == "attributes":
            target = parent_list[idx]
            for n in new_nodes:
                if isinstance(n, dict):
                    for k, v in n.items():
                        target[k] = v
    flat = _form_children_to_flat_fields(children)
    base_view["fields"] = flat


def _parse_xpath_from_raw_xml(raw_xml_list):
    """Parse xpath elements from raw XML elements. Returns list of xpath ops."""
    ops = []
    for el in raw_xml_list:
        xpaths = [el] if el.tag == "xpath" else el.findall("xpath")
        for xp in xpaths:
            expr = xp.get("expr", "")
            position = xp.get("position", "inside")
            nodes = [_parse_form_child(c) for c in xp]
            ops.append({"expr": expr, "position": position, "nodes": nodes})
    return ops


def get_view_for_model(model: str, view_type: str, registry: Dict) -> Optional[Dict]:
    """Get view definition for model and type (list/form)."""
    views = registry.get("views", {}).get(model, [])
    for v in views:
        if v.get("type") == view_type:
            return v
    return None
