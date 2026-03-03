"""Security - access rights from ir.model.access.csv."""

import csv
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

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


# Record rules: model -> list of domains to AND with search
_RECORD_RULES: Dict[str, List[List]] = {}


def load_record_rules(addons_paths: List[Path]) -> Dict[str, List[List]]:
    """Load ir.rule from security/ir_rule.xml. Returns model -> [domain, ...]."""
    result: Dict[str, List[List]] = {}
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
                    domain_force = []
                    for f in rec.findall("{*}field"):
                        name = f.get("name")
                        if name == "model_id":
                            model_ref = (f.text or "").strip()
                            if model_ref and model_ref.startswith("model_"):
                                model_ref = model_ref.replace("model_", "").replace("_", ".")
                        elif name == "domain_force":
                            text = (f.text or "").strip()
                            if text:
                                try:
                                    domain_force = eval(text)
                                except Exception:
                                    pass
                    if model_ref and domain_force:
                        result.setdefault(model_ref, []).append(domain_force)
            except Exception:
                pass
    return result


def get_record_rules(model_name: str, uid: int) -> List[List]:
    """Get record rule domains for model. Substitute uid in domain."""
    global _RECORD_RULES
    if not _RECORD_RULES:
        from core.tools import config
        _RECORD_RULES = load_record_rules(config.get_addons_paths())
    rules = _RECORD_RULES.get(model_name, [])
    out = []
    for domain in rules:
        sub = []
        for term in domain:
            if isinstance(term, (list, tuple)) and len(term) >= 3:
                val = term[2]
                if val == "uid" or (isinstance(val, str) and "uid" in val):
                    val = uid
                sub.append([term[0], term[1], val])
        if sub:
            out.append(sub)
    return out


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
