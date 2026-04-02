"""Generic XML data loading via ORM + ir.model.data (Phases 409–410)."""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import Any, Callable, Dict, List, Optional, Tuple

from core.modules.module import get_manifest, get_module_path, resolve_load_order
from core.tools import config
from core.tools.safe_eval import safe_eval

from .xml_loader import parse_record_element

_logger = logging.getLogger("erp.data_loader")

# Handled by views_registry + init_data specialised loaders
# ir.rule: security/ir_rule.xml is loaded by init_data._load_ir_rules (model char + domain).
# Generic XML uses Odoo-style model_id; skipping avoids duplicate loads and write errors on unknown fields.
_SKIP_MODELS = frozenset({"ir.ui.view", "ir.actions.act_window", "ir.ui.menu", "ir.rule"})


def _text_el(el: ET.Element) -> str:
    return (el.text or "").strip()


def _full_xml_id(module: str, xml_id: str) -> str:
    if not xml_id:
        return ""
    if "." in xml_id:
        return xml_id
    return f"{module}.{xml_id}"


def _lookup_res_id(env: Any, DataModel: Any, full_xid: str, session: Dict[str, int]) -> Optional[int]:
    if full_xid in session:
        return session[full_xid]
    if "." not in full_xid:
        return None
    mod, name = full_xid.split(".", 1)
    rows = DataModel.search_read([("module", "=", mod), ("name", "=", name)], ["res_id"], limit=1)
    if rows:
        rid = rows[0].get("res_id")
        return int(rid) if rid is not None else None
    return None


def _coerce_simple_value(val: str) -> Any:
    s = val.strip()
    if s == "True":
        return True
    if s == "False":
        return False
    if s == "None":
        return None
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return val


def _resolve_field_value(
    env: Any,
    model_name: str,
    field_name: str,
    raw: Any,
    ref_cb: Callable[[str], Optional[int]],
    eval_ctx: Dict[str, Any],
) -> Any:
    if isinstance(raw, dict) and "_ref" in raw:
        rid = ref_cb(str(raw["_ref"]))
        if rid is None:
            raise ValueError(f"Unresolved ref {raw['_ref']} for {model_name}.{field_name}")
        return rid
    if isinstance(raw, dict) and "_eval" in raw:
        return safe_eval(raw["_eval"], eval_ctx)
    if isinstance(raw, str):
        return _coerce_simple_value(raw)
    return raw


def _build_eval_context(env: Any, ref_cb: Callable[[str], Optional[int]]) -> Dict[str, Any]:
    def ref(xid: str) -> int:
        rid = ref_cb(xid)
        if rid is None:
            raise ValueError(f"ref({xid!r}) not found")
        return rid

    return {"ref": ref, "True": True, "False": False, "None": None}


def _iter_module_xml_ops(module: str, rel_path: str) -> List[Tuple[bool, str, ET.Element]]:
    """Return list of (noupdate, tag, element) for each top-level op under <data>."""
    base = get_module_path(module)
    if base is None:
        return []
    path = base / rel_path
    if not path.exists():
        return []
    try:
        tree = ET.parse(path)
        root = tree.getroot()
    except ET.ParseError as e:
        _logger.warning("Parse error %s: %s", path, e)
        return []
    out: List[Tuple[bool, str, ET.Element]] = []
    for data_el in root.findall(".//data"):
        noupdate = data_el.get("noupdate", "0") in ("1", "true", "True")
        for el in data_el:
            if el.tag in ("record", "delete", "function"):
                out.append((noupdate, el.tag, el))
    return out


def _get_demo_files(module_name: str) -> List[str]:
    try:
        m = get_manifest(module_name)
        return m.get("demo", []) or []
    except Exception:
        return []


def _get_data_files(module_name: str) -> List[str]:
    try:
        m = get_manifest(module_name)
        return m.get("data", []) or []
    except Exception:
        return []


def apply_generic_xml_file(
    env: Any,
    module: str,
    rel_path: str,
    *,
    update_mode: bool = False,
    is_demo: bool = False,
) -> None:
    """
    Load arbitrary <record> elements from XML via ORM; register ir.model.data.
    Skips view/action/menu (handled elsewhere).
    """
    _ = is_demo  # reserved for future demo-specific behaviour
    Data = env.get("ir.model.data")
    if not Data:
        _logger.debug("ir.model.data not available, skip generic loader")
        return

    ops = _iter_module_xml_ops(module, rel_path)
    if not ops:
        return

    session_map: Dict[str, int] = {}

    def ref_cb(xid: str) -> Optional[int]:
        fx = _full_xml_id(module, xid) if xid and "." not in xid else xid
        return _lookup_res_id(env, Data, fx, session_map)

    for noupdate, tag, el in ops:
        if tag == "function":
            model_name = el.get("model", "")
            name = el.get("name", "")
            if not model_name or not name:
                continue
            Model = env.get(model_name)
            if not Model:
                continue
            fn = getattr(Model, name, None)
            if not callable(fn):
                _logger.warning("function %s.%s missing", model_name, name)
                continue
            try:
                eval_ctx = _build_eval_context(env, ref_cb)
                args: List[Any] = []
                for child in el:
                    if child.tag != "value":
                        continue
                    ev = child.get("eval")
                    if ev is not None:
                        args.append(safe_eval(ev, eval_ctx))
                    else:
                        args.append(_coerce_simple_value(_text_el(child)))
                fn(*args)
            except Exception as e:
                _logger.warning("function %s.%s failed: %s", model_name, name, e)
            continue

        if tag == "delete":
            model_name = el.get("model", "")
            xid = el.get("id", "")
            if not model_name or not xid:
                continue
            full = _full_xml_id(module, xid) if "." not in xid else xid
            rid = _lookup_res_id(env, Data, full, session_map)
            Model = env.get(model_name)
            if Model and rid:
                try:
                    Model.unlink([rid])
                except Exception as e:
                    _logger.warning("delete %s id=%s: %s", model_name, rid, e)
            if "." in full:
                mod_part, name_part = full.split(".", 1)
                ds = Data.search([("module", "=", mod_part), ("name", "=", name_part)])
                ds.unlink()
            continue

        if tag != "record":
            continue

        rec = parse_record_element(el)
        model_name = rec.get("_model", "")
        xml_id = rec.get("_id", "")
        rec_noupdate = bool(rec.get("_noupdate", noupdate))

        if not model_name or model_name in _SKIP_MODELS:
            continue

        Model = env.get(model_name)
        if not Model:
            _logger.debug("Model %s not loaded, skip record %s", model_name, xml_id)
            continue

        if not xml_id:
            _logger.debug("Skip %s record without id", model_name)
            continue

        full_xid = _full_xml_id(module, xml_id)
        mod_part, name_part = full_xid.split(".", 1)

        existing_row = None
        rows = Data.search_read(
            [("module", "=", mod_part), ("name", "=", name_part)],
            ["id", "res_id", "noupdate"],
            limit=1,
        )
        if rows:
            existing_row = rows[0]

        if update_mode and existing_row and (existing_row.get("noupdate") or rec_noupdate):
            rid = existing_row.get("res_id")
            if rid:
                session_map[full_xid] = int(rid)
            continue

        vals: Dict[str, Any] = {}
        eval_ctx = _build_eval_context(env, ref_cb)

        for key, val in rec.items():
            if key.startswith("_") or key in ("id",):
                continue
            try:
                vals[key] = _resolve_field_value(env, model_name, key, val, ref_cb, eval_ctx)
            except Exception as e:
                _logger.warning("Field %s.%s: %s", model_name, key, e)
                raise

        res_id: Optional[int] = None
        if existing_row:
            rid = existing_row.get("res_id")
            if rid:
                try:
                    Model.browse(int(rid)).write(vals)
                    res_id = int(rid)
                except Exception as e:
                    _logger.warning("write %s %s: %s", model_name, rid, e)
                    raise
        if res_id is None:
            try:
                new_rec = Model.create(vals)
                res_id = new_rec.id if new_rec and getattr(new_rec, "id", None) else None
                if res_id is None and getattr(new_rec, "ids", None):
                    res_id = new_rec.ids[0] if new_rec.ids else None
            except Exception as e:
                _logger.warning("create %s: %s vals=%s", model_name, e, vals)
                raise

        if res_id is None:
            continue

        session_map[full_xid] = res_id

        if existing_row:
            Data.browse(existing_row["id"]).write({
                "model": model_name,
                "res_id": res_id,
                "noupdate": rec_noupdate,
            })
        else:
            Data.create({
                "module": mod_part,
                "name": name_part,
                "model": model_name,
                "res_id": res_id,
                "noupdate": rec_noupdate,
            })


def load_generic_data_for_modules(env: Any, module_names: Optional[List[str]] = None, *, update_mode: bool = False) -> None:
    """Apply generic XML records for manifest data files (excluding view/action/menu)."""
    if module_names is None:
        module_names = config.get_config().get("server_wide_modules", ["base", "web"])
    order = resolve_load_order(module_names)
    for mod in order:
        if get_module_path(mod) is None:
            continue
        for rel in _get_data_files(mod):
            if not rel.endswith(".xml"):
                continue
            try:
                apply_generic_xml_file(env, mod, rel, update_mode=update_mode, is_demo=False)
            except Exception as e:
                _logger.warning("Generic data %s %s: %s", mod, rel, e)


def load_demo_data_for_modules(env: Any, module_names: Optional[List[str]] = None) -> None:
    """Load manifest demo XML when demo is enabled."""
    if not config.get_config().get("load_demo", False):
        return
    if module_names is None:
        module_names = config.get_config().get("server_wide_modules", ["base", "web"])
    order = resolve_load_order(module_names)
    for mod in order:
        if get_module_path(mod) is None:
            continue
        for rel in _get_demo_files(mod):
            if not rel.endswith(".xml"):
                continue
            try:
                apply_generic_xml_file(env, mod, rel, update_mode=False, is_demo=True)
            except Exception as e:
                _logger.warning("Demo data %s %s: %s", mod, rel, e)
