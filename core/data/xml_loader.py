"""Parse Odoo-style XML data files (ir.ui.view, ir.actions.act_window, menuitem)."""

import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.modules.module import get_module_path

_logger = __import__("logging").getLogger("erp.data")


def _text(el: ET.Element) -> str:
    return (el.text or "").strip()


def _parse_record(el: ET.Element) -> Dict[str, Any]:
    """Parse <record model="..." id="...">."""
    model = el.get("model", "")
    xml_id = el.get("id", "")
    data = {"_model": model, "_id": xml_id}
    for field in el.findall("field"):
        name = field.get("name")
        if not name:
            continue
        ref = field.get("ref")
        if ref:
            data[name] = {"_ref": ref}
        elif field.get("type") == "xml":
            child = list(field)
            if child:
                if name == "arch" and model == "ir.ui.view":
                    first = child[0]
                    if first.tag == "xpath" or (first.tag == "data" and first.findall("xpath")):
                        data[name] = {"_raw_xml": child}
                    else:
                        data[name] = _arch_to_dict(first)
                else:
                    data[name] = _arch_to_dict(child[0])
            else:
                data[name] = _text(field)
        else:
            data[name] = _text(field)
    return data


def _parse_form_child(child: ET.Element) -> Dict[str, Any]:
    """Parse a single child of form/group/page (field, group, page, header, sheet, button)."""
    tag = child.tag
    if tag == "header":
        children = []
        for c in child:
            children.append(_parse_form_child(c))
        return {"type": "header", "children": children}
    if tag == "sheet":
        children = []
        for c in child:
            children.append(_parse_form_child(c))
        return {"type": "sheet", "children": children}
    if tag == "button":
        return {
            "type": "button",
            "name": child.get("name", ""),
            "string": child.get("string", ""),
            "btn_type": child.get("type", "object"),
            "class": child.get("class", ""),
        }
    if tag == "div":
        classes = (child.get("class") or "").split()
        if "oe_button_box" in classes or "o_button_box" in classes:
            btn_children = []
            for c in child:
                btn_children.append(_parse_form_child(c))
            return {"type": "button_box", "children": btn_children}
    if tag == "field":
        field_def = {"type": "field", "name": child.get("name", ""), "string": child.get("string", "")}
        domain = child.get("domain", "")
        if domain:
            field_def["domain"] = domain
        domain_dep = child.get("domain_dep", "")
        if domain_dep:
            field_def["domain_dep"] = domain_dep
        comodel = child.get("comodel", "")
        if comodel:
            field_def["comodel"] = comodel
        widget = child.get("widget", "")
        if widget:
            field_def["widget"] = widget
        invisible = child.get("invisible", "")
        if invisible:
            field_def["invisible"] = invisible
        readonly = child.get("readonly", "")
        if readonly:
            field_def["readonly"] = readonly
        required = child.get("required", "")
        if required:
            field_def["required_cond"] = required
        return field_def
    if tag == "group":
        children = []
        for c in child:
            children.append(_parse_form_child(c))
        return {"type": "group", "string": child.get("string", ""), "col": child.get("col", "2"), "children": children}
    if tag == "page":
        children = []
        for c in child:
            children.append(_parse_form_child(c))
        return {"type": "page", "string": child.get("string", ""), "children": children}
    if tag == "notebook":
        pages = []
        for p in child.findall("page"):
            page_children = []
            for c in p:
                page_children.append(_parse_form_child(c))
            pages.append({"type": "page", "string": p.get("string", ""), "children": page_children})
        return {"type": "notebook", "pages": pages}
    return {"type": "unknown"}


def _form_children_to_flat_fields(children: List[Dict]) -> List[Dict]:
    """Flatten form tree to list of field defs (for backward compat)."""
    result = []
    for c in children:
        if c.get("type") == "field":
            result.append(c)
        elif c.get("type") in ("group", "page", "header", "sheet"):
            result.extend(_form_children_to_flat_fields(c.get("children", [])))
        elif c.get("type") == "button_box":
            result.extend(_form_children_to_flat_fields(c.get("children", [])))
        elif c.get("type") == "notebook":
            for p in c.get("pages", []):
                result.extend(_form_children_to_flat_fields(p.get("children", [])))
    return result


def _arch_to_dict(node: ET.Element) -> Dict[str, Any]:
    """Convert arch XML to dict (list/form/kanban structure)."""
    tag = node.tag
    if tag == "list":
        cols = []
        for f in node.findall("field"):
            col_def = {"name": f.get("name", ""), "string": f.get("string", "")}
            comodel = f.get("comodel", "")
            if comodel:
                col_def["comodel"] = comodel
            cols.append(col_def)
        return {"type": "list", "columns": cols}
    if tag == "form":
        children = []
        for c in node:
            children.append(_parse_form_child(c))
        flat = _form_children_to_flat_fields(children)
        return {"type": "form", "children": children, "fields": flat}
    if tag == "kanban":
        default_group = node.get("default_group_by", "")
        fields = [f.get("name", "") for f in node.findall("field") if f.get("name")]
        return {"type": "kanban", "default_group_by": default_group, "fields": fields}
    if tag == "search":
        search_fields = [f.get("name", "") for f in node.findall("field") if f.get("name")]
        filters = []
        group_bys = []
        for f in node.findall("filter"):
            name = f.get("name", "")
            string = f.get("string", "") or name
            domain = f.get("domain", "")
            ctx = f.get("context", "")
            if not name:
                continue
            gb = None
            if ctx:
                import ast
                try:
                    parsed = ast.literal_eval(ctx.replace("'", '"')) if isinstance(ctx, str) else ctx
                    if isinstance(parsed, dict) and "group_by" in parsed:
                        gb = parsed["group_by"]
                except Exception:
                    pass
            if gb:
                group_bys.append({"name": name, "string": string, "group_by": gb})
            if domain:
                filters.append({"name": name, "string": string, "domain": domain})
        return {"type": "search", "search_fields": search_fields, "filters": filters, "group_bys": group_bys}
    if tag == "calendar":
        date_start = node.get("date_start", "")
        string = node.get("string", "")
        return {"type": "calendar", "date_start": date_start, "string": string}
    if tag == "graph":
        graph_type = node.get("type", "bar")
        fields = []
        for f in node.findall("field"):
            role = f.get("type", "")
            if role in ("row", "col", "measure"):
                fd = {"name": f.get("name", ""), "role": role}
                comodel = f.get("comodel", "")
                if comodel:
                    fd["comodel"] = comodel
                fields.append(fd)
        return {"type": "graph", "graph_type": graph_type, "fields": fields}
    if tag == "pivot":
        fields = []
        for f in node.findall("field"):
            role = f.get("type", "")
            if role in ("row", "col", "measure"):
                fd = {"name": f.get("name", ""), "role": role}
                comodel = f.get("comodel", "")
                if comodel:
                    fd["comodel"] = comodel
                fields.append(fd)
        return {"type": "pivot", "fields": fields}
    if tag == "activity":
        date_deadline = node.get("date_deadline", "")
        string = node.get("string", "Activities")
        fields = [f.get("name", "") for f in node.findall("field") if f.get("name")]
        return {"type": "activity", "date_deadline": date_deadline, "string": string, "fields": fields}
    return {"type": tag}


def _parse_menuitem(el: ET.Element) -> Dict[str, Any]:
    """Parse <menuitem id="..." name="..." action="..." parent="..."/>."""
    return {
        "_model": "ir.ui.menu",
        "id": el.get("id", ""),
        "name": el.get("name", ""),
        "action": el.get("action", ""),
        "parent": el.get("parent", ""),
        "sequence": int(el.get("sequence", 10)),
    }


def load_xml_data(module_name: str, rel_path: str) -> List[Dict[str, Any]]:
    """Load and parse XML data file. Returns list of records/menuitems."""
    base = get_module_path(module_name)
    if base is None:
        return []
    path = base / rel_path
    if not path.exists():
        return []

    try:
        tree = ET.parse(path)
        root = tree.getroot()
    except ET.ParseError as e:
        _logger.warning("Parse error in %s: %s", path, e)
        return []

    result = []
    for data_el in root.findall(".//data"):
        for el in data_el:
            if el.tag == "record":
                result.append(_parse_record(el))
            elif el.tag == "menuitem":
                result.append(_parse_menuitem(el))
    return result


def resolve_refs(records: List[Dict], id_map: Dict[str, str]) -> None:
    """Resolve _ref in records. id_map: xml_id -> resolved_id."""
    for r in records:
        for k, v in list(r.items()):
            if isinstance(v, dict) and "_ref" in v:
                ref = v["_ref"]
                r[k] = id_map.get(ref, ref)
