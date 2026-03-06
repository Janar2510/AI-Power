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
                data[name] = _arch_to_dict(child[0])
            else:
                data[name] = _text(field)
        else:
            data[name] = _text(field)
    return data


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
        fields = []
        for f in node.findall("field"):
            field_def = {"name": f.get("name", ""), "string": f.get("string", "")}
            domain = f.get("domain", "")
            if domain:
                field_def["domain"] = domain
            domain_dep = f.get("domain_dep", "")
            if domain_dep:
                field_def["domain_dep"] = domain_dep
            comodel = f.get("comodel", "")
            if comodel:
                field_def["comodel"] = comodel
            fields.append(field_def)
        return {"type": "form", "fields": fields}
    if tag == "kanban":
        default_group = node.get("default_group_by", "")
        fields = [f.get("name", "") for f in node.findall("field") if f.get("name")]
        return {"type": "kanban", "default_group_by": default_group, "fields": fields}
    if tag == "search":
        search_fields = [f.get("name", "") for f in node.findall("field") if f.get("name")]
        return {"type": "search", "search_fields": search_fields}
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
