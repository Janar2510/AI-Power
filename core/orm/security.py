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
