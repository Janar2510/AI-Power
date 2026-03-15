"""Model base class and recordset."""

import base64
from typing import Any, Dict, List, Optional, Type, TypeVar, Iterator, Union, Tuple

T = TypeVar("T", bound="ModelBase")


def _trigger_dependant_recompute(
    registry: Any,
    written_model: str,
    written_ids: List[int],
    changed_fields: List[str],
) -> None:
    """Phase 100: When written_model's changed_fields are updated, recompute stored computed/related
    on other models that depend on them (e.g. partner_id.name -> crm.lead.partner_name)."""
    from core.orm import fields as fmod
    changed_set = set(changed_fields)
    if not changed_set or not written_ids:
        return
    env = getattr(registry, "_env", None)
    if not env or not hasattr(env, "cr") or not env.cr:
        return
    for other_name, Other in registry._models.items():
        if other_name == written_model:
            continue
        for fname in dir(Other):
            if fname.startswith("_"):
                continue
            field = getattr(Other, fname, None)
            if not isinstance(field, (fmod.Computed, fmod.Related)):
                continue
            if not getattr(field, "store", False):
                continue
            paths = []
            if isinstance(field, fmod.Related) and getattr(field, "related", ""):
                paths = [field.related]
            elif isinstance(field, fmod.Computed):
                paths = list(getattr(field, "depends", []) or [])
                method = getattr(Other, getattr(field, "compute", ""), None)
                if method and hasattr(method, "_depends"):
                    paths = list(set(paths) | set(method._depends))
            for path in paths:
                parts = [p.strip() for p in path.split(".") if p.strip()]
                if len(parts) < 2:
                    continue
                rel_field, comodel_field = parts[0], parts[1]
                if comodel_field not in changed_set:
                    continue
                rel_obj = getattr(Other, rel_field, None)
                if not isinstance(rel_obj, fmod.Many2one):
                    continue
                if getattr(rel_obj, "comodel", "") != written_model:
                    continue
                try:
                    recs = Other.search([(rel_field, "in", written_ids)])
                    if not recs or not recs._ids:
                        continue
                    computed_list = recs._model._compute_stored_values(recs)
                    related_list = recs._model._compute_related_values(recs)
                    computed_stored = set(recs._model._get_stored_computed_fields())
                    related_stored = set(recs._model._get_stored_related_fields())
                    table = recs._model._table
                    cr = env.cr
                    if not table or not cr:
                        continue
                    for i, rid in enumerate(recs._ids):
                        to_write = {}
                        if i < len(related_list) and related_list[i]:
                            to_write.update({k: v for k, v in related_list[i].items() if k in related_stored})
                        if i < len(computed_list) and computed_list[i]:
                            to_write.update({k: v for k, v in computed_list[i].items() if k in computed_stored})
                        if to_write:
                            sets = ", ".join(f'"{k}" = %s' for k in to_write)
                            cr.execute(f'UPDATE "{table}" SET {sets} WHERE id = %s', list(to_write.values()) + [rid])
                except Exception:
                    pass


def _domain_to_sql(
    domain: List,
    table: str,
    cr: Any,
    model_cls: Type["ModelBase"],
) -> Tuple[str, List[Any]]:
    """Convert Odoo domain to (WHERE clause, params). Supports | (OR), & (AND), and leaf terms."""
    if not domain:
        return "1=1", []

    # Polish notation: ['|', term1, term2] or ['&', term1, term2]
    if len(domain) >= 3 and domain[0] in ("|", "&") and isinstance(domain[1], (list, tuple)) and isinstance(domain[2], (list, tuple)):
        op = domain[0]
        w1, p1 = _domain_to_sql(domain[1], table, cr, model_cls)
        w2, p2 = _domain_to_sql(domain[2], table, cr, model_cls)
        joiner = " OR " if op == "|" else " AND "
        return f"({w1}){joiner}({w2})", p1 + p2

    # Leaf: [field, op, value]
    if len(domain) >= 3 and isinstance(domain[0], str) and isinstance(domain[1], str):
        fld, op, val = domain[0], domain[1], domain[2]
        if op == "=":
            if val is False or val is None:
                return f'"{fld}" IS NULL', []
            return f'"{fld}" = %s', [val]
        if op == "!=":
            return f'("{fld}" IS NULL OR "{fld}" != %s)', [val]
        if op in ("<", ">", ">=", "<="):
            return f'"{fld}" {op} %s', [val]
        if op == "in":
            vals = list(val) if isinstance(val, (list, tuple)) else [val]
            if not vals:
                return "1=0", []
            ph = ", ".join("%s" for _ in vals)
            return f'"{fld}" IN ({ph})', vals
        if op == "not in":
            vals = list(val) if isinstance(val, (list, tuple)) else [val]
            if not vals:
                return "1=1", []
            ph = ", ".join("%s" for _ in vals)
            return f'("{fld}" IS NULL OR "{fld}" NOT IN ({ph}))', vals
        if op == "ilike":
            return f'"{fld}" ILIKE %s', [f"%{val}%" if isinstance(val, str) else val]
        if op == "like":
            return f'"{fld}" LIKE %s', [f"%{val}%" if isinstance(val, str) else val]
        if op == "=like":
            return f'"{fld}" LIKE %s', [val]
        if op == "child_of":
            cr.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=%s AND column_name='parent_id'",
                (table,),
            )
            if cr.fetchone():
                cr.execute(
                    f"""
                    WITH RECURSIVE descendants AS (
                        SELECT id FROM "{table}" WHERE id = %s
                        UNION ALL
                        SELECT p.id FROM "{table}" p INNER JOIN descendants d ON p.parent_id = d.id
                    )
                    SELECT id FROM descendants
                    """,
                    (val,),
                )
                child_ids = [r["id"] if hasattr(r, "keys") else r[0] for r in cr.fetchall()]
                if not child_ids:
                    return "1=0", []
                ph = ", ".join("%s" for _ in child_ids)
                return f'"{fld}" IN ({ph})', child_ids
            return f'"{fld}" = %s', [val]
        if op == "parent_of":
            cr.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=%s AND column_name='parent_id'",
                (table,),
            )
            if cr.fetchone():
                cr.execute(
                    f"""
                    WITH RECURSIVE ancestors AS (
                        SELECT id, parent_id FROM "{table}" WHERE id = %s
                        UNION ALL
                        SELECT p.id, p.parent_id FROM "{table}" p INNER JOIN ancestors a ON p.id = a.parent_id
                    )
                    SELECT id FROM ancestors
                    """,
                    (val,),
                )
                parent_ids = [r["id"] if hasattr(r, "keys") else r[0] for r in cr.fetchall()]
                if not parent_ids:
                    return "1=0", []
                ph = ", ".join("%s" for _ in parent_ids)
                return f'"{fld}" IN ({ph})', parent_ids
            return f'"{fld}" = %s', [val]

    # Implicit AND: list of terms
    parts = []
    all_params: List[Any] = []
    for term in domain:
        if not isinstance(term, (list, tuple)):
            continue
        w, p = _domain_to_sql(term, table, cr, model_cls)
        if w and w != "1=1":
            parts.append(f"({w})")
            all_params.extend(p)
    if not parts:
        return "1=1", []
    return " AND ".join(parts), all_params


class Recordset:
    """Recordset - list of record IDs with model reference."""

    def __init__(self, model: Type["ModelBase"], ids: Optional[List[int]] = None, _env: Any = None):
        self._model = model
        self._ids = list(ids or [])
        self._env = _env  # Phase 105: carry env to avoid registry._env drift (closed cursor)

    def read(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Read all records in recordset."""
        if not self._ids:
            return []
        env = getattr(self, "_env", None) or (
            getattr(self._model._registry, "_env", None) if self._model._registry else None
        )
        if not env:
            return []
        rec = self._model(env, self._ids)
        return rec.read(fields)

    def unlink(self) -> bool:
        """Delete all records in recordset. Delegates to Model instance for cascade (Phase 100)."""
        if not self._ids:
            return True
        env = getattr(self, "_env", None) or (
            getattr(self._model._registry, "_env", None) if self._model._registry else None
        )
        if not env:
            return True
        rec = self._model(env, self._ids)
        return rec._unlink_impl()

    def write(self, vals: Dict[str, Any]) -> bool:
        """Write vals to all records in recordset."""
        if not self._ids or not vals:
            return True
        env = getattr(self, "_env", None) or (
            getattr(self._model._registry, "_env", None) if self._model._registry else None
        )
        if not env:
            return True
        rec = self._model(env, self._ids)
        return rec.write(vals)

    def __iter__(self) -> Iterator["ModelBase"]:
        for rid in self._ids:
            yield self._model.browse(rid)

    def __len__(self) -> int:
        return len(self._ids)

    def __bool__(self) -> bool:
        return bool(self._ids)

    @property
    def ids(self) -> List[int]:
        return self._ids.copy()

    @property
    def id(self) -> Optional[int]:
        """Single-record id; None if empty or multi-record."""
        return self._ids[0] if len(self._ids) == 1 else None

    @property
    def env(self) -> Any:
        """Environment from recordset or registry."""
        return getattr(self, "_env", None) or (
            getattr(self._model._registry, "_env", None) if self._model._registry else None
        )

    def __getattr__(self, name: str) -> Any:
        """Delegate model methods (e.g. activity_schedule) to Model, passing self as first arg."""
        if hasattr(self._model, name):
            attr = getattr(self._model, name)
            if callable(attr):
                def _bound(*args: Any, **kwargs: Any) -> Any:
                    return attr(self, *args, **kwargs)
                return _bound
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")


class Model(type):
    """Metaclass for model classes."""

    _name: str = ""
    _inherit: str = ""
    _description: str = ""
    _table: Optional[str] = None
    _registry: Optional[Any] = None

    def __new__(mcs, name: str, bases: tuple, attrs: dict):
        cls = super().__new__(mcs, name, bases, attrs)
        if cls._name:
            cls._table = cls._table or cls._name.replace(".", "_")
        return cls

    def __init__(cls, name: str, bases: tuple, attrs: dict):
        super().__init__(name, bases, attrs)
        inherit = getattr(cls, "_inherit", "")
        if inherit and not cls._name and cls._registry:
            cls._registry.merge_model(inherit, cls, attrs)
        elif cls._name and cls._registry:
            cls._registry.register_model(cls._name, cls)


class ModelBase(metaclass=Model):
    """Base class for database-persisted models."""

    _name = ""
    _description = ""
    _table = None
    _registry = None

    def __init__(self, env: Any, ids: List[int], vals: Optional[Dict[str, Any]] = None):
        self.env = env
        self._ids = ids or []
        self._cache: Dict[str, Any] = vals or {}

    @classmethod
    def browse(cls: Type[T], id_or_ids: Union[int, List[int]]) -> Union[T, Recordset]:
        """Browse record(s) by ID."""
        if isinstance(id_or_ids, list):
            return Recordset(cls, id_or_ids)
        return cls._create_record(int(id_or_ids))

    @classmethod
    def _create_record(cls: Type[T], id: int) -> T:
        """Create a single record instance."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if env is None:
            env = object()
        return cls(env, [id])

    def __iter__(self) -> Iterator["ModelBase"]:
        for rid in self._ids:
            yield self._model.browse(rid)

    def __len__(self) -> int:
        return len(self._ids)

    @property
    def _model(self) -> Type["ModelBase"]:
        return type(self)

    @property
    def id(self) -> Optional[int]:
        return self._ids[0] if len(self._ids) == 1 else None

    @property
    def ids(self) -> List[int]:
        return self._ids.copy()

    def _get_cr(self):
        """Get cursor from env if available."""
        env = getattr(self._registry, "_env", None) if self._registry else None
        return env.cr if env and hasattr(env, "cr") else None

    def _get_stored_columns(self) -> List[str]:
        """Return field names that have a DB column (excludes One2many, Many2many)."""
        from core.orm import fields as fmod
        result = []
        for name in dir(self._model):
            if name.startswith("_"):
                continue
            obj = getattr(self._model, name)
            if isinstance(obj, fmod.Field) and getattr(obj, "column_type", None) is not None:
                result.append(name)
        return result

    @classmethod
    def default_get(cls: Type[T], field_names: Optional[List[str]] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Return default values for fields. Merges field.default with context['default_<fname>'] (Phase 69)."""
        from core.orm import fields as fmod
        context = context or {}
        result: Dict[str, Any] = {}
        for name in dir(cls):
            if name.startswith("_"):
                continue
            obj = getattr(cls, name, None)
            if not isinstance(obj, fmod.Field):
                continue
            if field_names and name not in field_names:
                continue
            if isinstance(obj, (fmod.One2many, fmod.Many2many)):
                continue
            val = None
            ctx_key = f"default_{name}"
            if ctx_key in context:
                val = context[ctx_key]
            elif hasattr(obj, "default") and obj.default is not None:
                d = obj.default
                val = d() if callable(d) else d
            if val is not None:
                result[name] = val
        return result

    @classmethod
    def fields_get(cls: Type[T], allfields: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
        """Return metadata for model fields. Mirrors Odoo fields_get()."""
        from core.orm import fields as fmod
        result: Dict[str, Dict[str, Any]] = {}
        for name in dir(cls):
            if name.startswith("_"):
                continue
            if allfields and name not in allfields:
                continue
            obj = getattr(cls, name, None)
            if not isinstance(obj, fmod.Field):
                continue
            info: Dict[str, Any] = {
                "type": getattr(obj, "type", "char"),
                "string": getattr(obj, "string", "") or name.replace("_", " ").title(),
                "required": getattr(obj, "required", False),
                "readonly": getattr(obj, "readonly", False),
            }
            if hasattr(obj, "comodel") and obj.comodel:
                info["comodel"] = obj.comodel
            if hasattr(obj, "selection") and obj.selection:
                info["selection"] = obj.selection
            if hasattr(obj, "inverse_name") and obj.inverse_name:
                info["inverse_name"] = obj.inverse_name
            if hasattr(obj, "default") and obj.default is not None:
                info["default"] = obj.default
            if hasattr(obj, "currency_field") and obj.currency_field:
                info["currency_field"] = obj.currency_field
            result[name] = info
        return result

    def read(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Read field values from DB or cache (instance API)."""
        # Prefer cursor from instance env (avoids registry._env drift in RPC/cursor context)
        cr = None
        if hasattr(self, "env") and self.env and hasattr(self.env, "cr"):
            cr = self.env.cr
        if cr is None:
            cr = self._get_cr()
        if not cr or not self._ids:
            return [{"id": rid, **self._cache} for rid in self._ids]
        table = self._model._table
        requested = fields or ["id"]
        stored = self._get_stored_columns()
        cols = [c for c in requested if c in stored]
        if not cols:
            cols = ["id"]
        # id is implicit (every table has it); include when requested
        if "id" in requested and "id" not in cols:
            cols = ["id"] + cols
        col_list = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join("%s" for _ in self._ids)
        query = f'SELECT {col_list} FROM "{table}" WHERE id IN ({placeholders})'
        cr.execute(query, self._ids)
        raw_rows = cr.fetchall()
        rows = [dict(row) for row in raw_rows]
        from core.orm import fields as fmod
        for fname in requested:
            if fname in cols:
                continue
            field = getattr(self._model, fname, None)
            if not isinstance(field, (fmod.One2many, fmod.Many2many)):
                continue
            for i, rid in enumerate(self._ids):
                if isinstance(field, fmod.One2many):
                    inv_name = getattr(field, "inverse_name", "")
                    comodel = getattr(field, "comodel", "")
                    if comodel and inv_name:
                        Comodel = self.env.get(comodel) if hasattr(self, "env") else None
                        if Comodel:
                            domain = [(inv_name, "=", rid)]
                            extra = getattr(field, "domain", None)
                            if extra:
                                d = extra(self._model) if callable(extra) else (extra or [])
                                domain = d + domain
                            recs = Comodel.search(domain)
                            rows[i][fname] = recs.ids if hasattr(recs, "ids") else []
                elif isinstance(field, fmod.Many2many):
                    rel = getattr(field, "relation", "")
                    col1 = getattr(field, "column1", "left_id")
                    col2 = getattr(field, "column2", "right_id")
                    if rel and cr:
                        try:
                            cr.execute(f'SELECT "{col2}" FROM "{rel}" WHERE "{col1}" = %s', (rid,))
                            rows[i][fname] = [r[col2] if hasattr(r, "keys") else r[0] for r in cr.fetchall()]
                        except Exception:
                            rows[i][fname] = []
        for fname in requested:
            field = getattr(self._model, fname, None)
            if isinstance(field, fmod.Binary):
                for i in range(len(rows)):
                    val = rows[i].get(fname)
                    if val is not None:
                        b = val.tobytes() if isinstance(val, memoryview) else (val if isinstance(val, bytes) else None)
                        if b is not None:
                            rows[i][fname] = base64.b64encode(b).decode("ascii")
        self._prefetch_many2one_display(rows, requested)
        return rows

    def _prefetch_many2one_display(self, rows: List[Dict[str, Any]], requested: List[str]) -> None:
        """Batch-fetch display names for Many2one fields to avoid N+1. Adds fname_display to each row."""
        from core.orm import fields as fmod
        env = getattr(self, "env", None)
        if not env:
            return
        for fname in requested:
            field = getattr(self._model, fname, None)
            if not isinstance(field, fmod.Many2one):
                continue
            comodel = getattr(field, "comodel", "")
            if not comodel:
                continue
            ids = []
            for row in rows:
                v = row.get(fname)
                if v and v not in ids:
                    ids.append(v)
            if not ids:
                continue
            Comodel = env.get(comodel)
            if not Comodel:
                continue
            try:
                rel_rows = Comodel.browse(ids).read(["id", "name", "display_name"])
                display_map = {}
                for r in rel_rows:
                    rid = r.get("id")
                    name = r.get("display_name") or r.get("name") or str(rid)
                    if rid:
                        display_map[rid] = name
                for row in rows:
                    v = row.get(fname)
                    row[fname + "_display"] = display_map.get(v) if v else None
            except Exception:
                for row in rows:
                    row[fname + "_display"] = None

    def write(self, vals: Dict[str, Any]) -> bool:
        """Write field values to DB."""
        from core.orm.api import ValidationError
        if not vals or not self._ids:
            return True
        env = getattr(self, "env", None)
        if env and getattr(env, "uid", None):
            allowed = self._model.search([("id", "in", self._ids)], operation="write")
            allowed_ids = set(allowed.ids if hasattr(allowed, "ids") else [])
            denied = [rid for rid in self._ids if rid not in allowed_ids]
            if denied:
                raise PermissionError(f"Access denied by record rule for write on {self._model._name}: {denied}")
        vals = dict(vals)
        from core.orm import fields as fmod
        # Phase 100: inverse for computed fields - call inverse instead of direct write
        for fname in list(vals.keys()):
            field = getattr(self._model, fname, None)
            if not isinstance(field, fmod.Computed) or not getattr(field, "inverse", None):
                continue
            inv = field.inverse
            method = getattr(self._model, inv, None) if isinstance(inv, str) else inv
            if callable(method):
                for rec in self:
                    if isinstance(inv, str):
                        getattr(rec._model, inv)(rec, vals[fname])
                    else:
                        inv(rec, vals[fname])
                del vals[fname]
        if not vals:
            return True
        vals = self._model._sanitize_html_vals(vals)
        vals = self._model._decode_binary_vals(vals)
        cr = self._get_cr()
        if not cr:
            self._cache.update(vals)
            return True
        stored = self._get_stored_columns()
        related_stored = set(self._model._get_stored_related_fields())
        computed_stored = set(self._model._get_stored_computed_fields())
        vals_stored = {
            k: v for k, v in vals.items()
            if k in stored and k not in related_stored and k not in computed_stored
        }
        if vals_stored:
            table = self._model._table
            sets = ", ".join(f'"{k}" = %s' for k in vals_stored)
            try:
                cr.execute(
                    f'UPDATE "{table}" SET {sets} WHERE id = %s',
                    list(vals_stored.values()) + [self._ids[0]],
                )
            except Exception as e:
                msg = self._model._sql_constraint_message(str(e))
                if msg:
                    raise ValidationError(msg) from e
                raise
        self._model._run_python_constraints(self, vals)
        for fname, val in vals.items():
            field = getattr(self._model, fname, None)
            if isinstance(field, fmod.One2many) and isinstance(val, (list, tuple)):
                lines = val
                comodel = getattr(field, "comodel", "")
                inv_name = getattr(field, "inverse_name", "")
                if not comodel or not inv_name:
                    continue
                env = getattr(self, "env", None)
                Comodel = env.get(comodel) if env else None
                if not Comodel:
                    continue
                parent_id = self._ids[0]
                current_ids = []
                domain = [(inv_name, "=", parent_id)]
                extra = getattr(field, "domain", None)
                if extra:
                    d = extra(self._model) if callable(extra) else (extra or [])
                    domain = d + domain
                try:
                    recs = Comodel.search(domain)
                    current_ids = recs.ids if hasattr(recs, "ids") else [r for r in recs]
                except Exception:
                    pass
                submitted_ids = []
                inv_extra = getattr(field, "inverse_extra", None)
                for line in lines:
                    if not isinstance(line, dict):
                        continue
                    lid = line.get("id")
                    line_vals = {k: v for k, v in line.items() if k != "id"}
                    if lid and lid in current_ids:
                        Comodel.browse(lid).write(line_vals)
                        submitted_ids.append(lid)
                    else:
                        line_vals[inv_name] = parent_id
                        if inv_extra and callable(inv_extra):
                            line_vals.update(inv_extra(self._model))
                        new_rec = Comodel.create(line_vals)
                        submitted_ids.append(new_rec.id if hasattr(new_rec, "id") else new_rec.ids[0])
                to_unlink = [i for i in current_ids if i not in submitted_ids]
                if to_unlink:
                    Comodel.browse(to_unlink).unlink()
                continue
            if not isinstance(field, fmod.Many2many):
                continue
            rel = getattr(field, "relation", "")
            col1 = getattr(field, "column1", "left_id")
            col2 = getattr(field, "column2", "right_id")
            if not rel:
                continue
            ids_to_set = []
            if isinstance(val, list):
                for item in val:
                    if isinstance(item, (list, tuple)) and len(item) >= 3 and item[0] == 6:
                        ids_to_set = list(item[2]) if item[2] else []
                        break
                    elif isinstance(item, int):
                        ids_to_set.append(item)
                if not ids_to_set and not any(isinstance(x, (list, tuple)) for x in val):
                    ids_to_set = [x for x in val if isinstance(x, int)]
            for rid in self._ids:
                cr.execute(f'DELETE FROM "{rel}" WHERE "{col1}" = %s', (rid,))
                for gid in ids_to_set:
                    if gid:
                        cr.execute(f'INSERT INTO "{rel}" ("{col1}", "{col2}") VALUES (%s, %s)', (rid, gid))
        computed_list = self._model._compute_stored_values(self)
        computed_stored = set(self._model._get_stored_computed_fields())
        if computed_list and cr:
            table = self._model._table
            for i, rid in enumerate(self._ids):
                to_write = {k: v for k, v in (computed_list[i] or {}).items() if k in computed_stored}
                if to_write:
                    self._cache.update(to_write)
                    sets = ", ".join(f'"{k}" = %s' for k in to_write)
                    cr.execute(
                        f'UPDATE "{table}" SET {sets} WHERE id = %s',
                        list(to_write.values()) + [rid],
                    )
        related_list = self._model._compute_related_values(self)
        related_stored = set(self._model._get_stored_related_fields())
        if related_list and cr:
            table = self._model._table
            for i, rid in enumerate(self._ids):
                to_write = {k: v for k, v in (related_list[i] or {}).items() if k in related_stored}
                if to_write:
                    self._cache.update(to_write)
                    sets = ", ".join(f'"{k}" = %s' for k in to_write)
                    cr.execute(
                        f'UPDATE "{table}" SET {sets} WHERE id = %s',
                        list(to_write.values()) + [rid],
                    )
        # Phase 100: trigger recompute of dependant stored computed/related fields
        registry = getattr(self._model, "_registry", None)
        if registry and cr and vals_stored:
            _trigger_dependant_recompute(registry, self._model._name, self._ids, list(vals_stored.keys()))
        # Phase 119: base.automation on_write
        env = getattr(self, "env", None)
        if env and self._ids and vals:
            from core.orm.automation import run_base_automation
            run_base_automation(env, "on_write", self._model._name, self._ids, vals)
        return True

    @classmethod
    def _get_stored_field_names(cls) -> List[str]:
        """Return field names that have a DB column."""
        from core.orm import fields as fmod
        result = []
        for name in dir(cls):
            if name.startswith("_"):
                continue
            obj = getattr(cls, name)
            if isinstance(obj, fmod.Field) and getattr(obj, "column_type", None) is not None:
                result.append(name)
        return result

    @classmethod
    def _get_stored_computed_fields(cls) -> List[str]:
        """Return stored computed field names (Computed with store=True)."""
        from core.orm import fields as fmod
        result = []
        for name in dir(cls):
            if name.startswith("_"):
                continue
            obj = getattr(cls, name)
            if isinstance(obj, fmod.Computed) and getattr(obj, "store", False):
                result.append(name)
        return result

    @classmethod
    def _get_stored_related_fields(cls) -> List[str]:
        """Return stored related field names (Related with store=True)."""
        from core.orm import fields as fmod
        result = []
        for name in dir(cls):
            if name.startswith("_"):
                continue
            obj = getattr(cls, name)
            if isinstance(obj, fmod.Related) and getattr(obj, "store", False):
                result.append(name)
        return result

    @classmethod
    def _compute_related_values(cls: Type[T], record: "Recordset") -> List[Dict[str, Any]]:
        """Compute stored related values. Supports single and multi-level (e.g. partner_id.name, partner_id.country_id.code)."""
        from core.orm import fields as fmod
        env = getattr(record, "env", None)
        if not env:
            return []
        related_names = cls._get_stored_related_fields()
        n = len(record._ids) if record._ids else 0
        result: List[Dict[str, Any]] = [{} for _ in range(n)]
        for fname in related_names:
            field = getattr(cls, fname, None)
            if not isinstance(field, fmod.Related) or not getattr(field, "related", ""):
                continue
            parts = [p.strip() for p in (field.related or "").split(".") if p.strip()]
            if len(parts) < 2:
                continue
            if len(parts) == 2:
                rel_field, target_field = parts[0], parts[1]
                rel_field_obj = getattr(cls, rel_field, None)
                if not isinstance(rel_field_obj, fmod.Many2one):
                    continue
                comodel = getattr(rel_field_obj, "comodel", "")
                Comodel = env.get(comodel) if comodel else None
                if not Comodel:
                    continue
                rows = record.read([rel_field])
                rel_ids = [r.get(rel_field) for r in rows if r.get(rel_field)]
                if not rel_ids:
                    continue
                rel_recs = Comodel.browse(rel_ids)
                rel_rows = rel_recs.read([target_field])
                rel_map = {}
                for i, r in enumerate(rel_rows):
                    rid = rel_recs._ids[i] if i < len(rel_recs._ids) else None
                    if rid:
                        rel_map[rid] = r.get(target_field)
                for i in range(n):
                    rel_id = rows[i].get(rel_field) if i < len(rows) else None
                    result[i][fname] = rel_map.get(rel_id) if rel_id else None
            else:
                current_model = cls
                first_rows = record.read([parts[0]])
                first_ids = [r.get(parts[0]) for r in first_rows]
                maps = []
                ids_at_step = [first_ids]
                for step in range(len(parts) - 1):
                    rel_field = parts[step]
                    next_field = parts[step + 1]
                    rel_field_obj = getattr(current_model, rel_field, None)
                    if not isinstance(rel_field_obj, fmod.Many2one):
                        break
                    comodel = getattr(rel_field_obj, "comodel", "")
                    current_model = env.get(comodel) if comodel else None
                    if not current_model:
                        break
                    ids = list(dict.fromkeys(x for x in ids_at_step[-1] if x))
                    if not ids:
                        break
                    rel_recs = current_model.browse(ids)
                    rel_rows = rel_recs.read([next_field])
                    step_map = {}
                    for i, r in enumerate(rel_rows):
                        rid = rel_recs._ids[i] if i < len(rel_recs._ids) else None
                        if rid:
                            step_map[rid] = r.get(next_field)
                    maps.append(step_map)
                    ids_at_step.append([step_map.get(pid) for pid in ids_at_step[-1]])
                if len(maps) == len(parts) - 1:
                    for i in range(n):
                        val = first_ids[i] if i < len(first_ids) else None
                        for step_map in maps:
                            val = step_map.get(val) if val else None
                        result[i][fname] = val
        return result

    @classmethod
    def _compute_stored_values(cls: Type[T], record: "Recordset") -> List[Dict[str, Any]]:
        """Run compute methods for stored computed fields. Returns list of dicts, one per record."""
        from core.orm import fields as fmod
        computed_names = cls._get_stored_computed_fields()
        n = len(record._ids) if record._ids else 0
        result: List[Dict[str, Any]] = [{} for _ in range(n)]
        for fname in computed_names:
            field = getattr(cls, fname, None)
            if not isinstance(field, fmod.Computed) or not getattr(field, "compute", None):
                continue
            method = getattr(cls, field.compute, None)
            if not callable(method):
                continue
            val = method(record)
            vals = val if isinstance(val, (list, tuple)) else [val] * n
            for i, v in enumerate(vals):
                if i < n:
                    result[i][fname] = v
        return result

    _sql_constraints: List[tuple] = []

    @classmethod
    def _sql_constraint_message(cls, error_str: str) -> Optional[str]:
        """Match SQL integrity error to _sql_constraints error message."""
        for name, _definition, message in (cls._sql_constraints or []):
            constraint_name = f"{cls._table}_{name}"
            if constraint_name in error_str:
                return message
        return None

    @classmethod
    def _run_python_constraints(cls: Type[T], record: "Recordset", vals: Dict[str, Any]) -> None:
        """Run @api.constrains methods relevant to changed fields. Raises ValidationError on failure."""
        changed_fields = set(vals.keys())
        for name in dir(cls):
            if name.startswith("__"):
                continue
            method = getattr(cls, name, None)
            if callable(method) and hasattr(method, "_constrains"):
                constrained = set(method._constrains)
                if constrained & changed_fields:
                    method(record)

    @classmethod
    def _sanitize_html_vals(cls: Type[T], vals: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize Html field values (strip script/style tags)."""
        import re
        from core.orm import fields as fmod
        out = dict(vals)
        for fname, val in vals.items():
            field = getattr(cls, fname, None)
            if isinstance(field, fmod.Html) and isinstance(val, str):
                s = re.sub(r"<script[^>]*>.*?</script>", "", val, flags=re.DOTALL | re.IGNORECASE)
                out[fname] = re.sub(r"<style[^>]*>.*?</style>", "", s, flags=re.DOTALL | re.IGNORECASE)
        return out

    @classmethod
    def _decode_binary_vals(cls: Type[T], vals: Dict[str, Any]) -> Dict[str, Any]:
        """Decode base64 strings to bytes for Binary fields (RPC sends base64)."""
        from core.orm import fields as fmod
        out = dict(vals)
        for fname, val in vals.items():
            field = getattr(cls, fname, None)
            if isinstance(field, fmod.Binary) and isinstance(val, str):
                try:
                    out[fname] = base64.b64decode(val)
                except Exception:
                    pass
        return out

    @classmethod
    def create(cls: Type[T], vals: Dict[str, Any]) -> T:
        """Create a new record in DB."""
        from core.orm.api import ValidationError
        vals = cls._sanitize_html_vals(vals)
        vals = cls._decode_binary_vals(vals)
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return cls.browse(1)
        table = cls._table
        stored = cls._get_stored_field_names()
        computed_stored = set(cls._get_stored_computed_fields())
        related_stored = set(cls._get_stored_related_fields())
        from core.orm import fields as fmod
        o2m_fields = {k for k in dir(cls) if not k.startswith("_") and isinstance(getattr(cls, k, None), fmod.One2many)}
        vals_stored = {
            k: v for k, v in vals.items()
            if k != "id" and k in stored and k not in computed_stored and k not in related_stored and k not in o2m_fields
        }
        cols = [c for c in vals_stored if c in stored]
        try:
            if cols:
                col_list = ", ".join(f'"{c}"' for c in cols)
                placeholders = ", ".join("%s" for _ in cols)
                cr.execute(
                    f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders}) RETURNING id',
                    [vals_stored[c] for c in cols],
                )
            else:
                cr.execute(f'INSERT INTO "{table}" DEFAULT VALUES RETURNING id')
        except Exception as e:
            msg = cls._sql_constraint_message(str(e))
            if msg:
                raise ValidationError(msg) from e
            raise
        row = cr.fetchone()
        new_id = row["id"] if hasattr(row, "keys") else row[0]
        new_rec = cls.browse(new_id)
        cls._run_python_constraints(new_rec, vals)
        computed_list = cls._compute_stored_values(new_rec)
        if computed_list and computed_list[0]:
            new_rec.write(computed_list[0])
        related_list = cls._compute_related_values(new_rec)
        if related_list and related_list[0]:
            new_rec.write(related_list[0])
        for fname in o2m_fields:
            lines = vals.get(fname)
            if not isinstance(lines, (list, tuple)):
                continue
            field = getattr(cls, fname, None)
            if not isinstance(field, fmod.One2many):
                continue
            comodel = getattr(field, "comodel", "")
            inv_name = getattr(field, "inverse_name", "")
            if not comodel or not inv_name:
                continue
            Comodel = env.get(comodel)
            if not Comodel:
                continue
            for line in lines:
                if not isinstance(line, dict):
                    continue
                line_vals = {k: v for k, v in line.items() if k != "id"}
                line_vals[inv_name] = new_id
                inv_extra = getattr(field, "inverse_extra", None)
                if inv_extra and callable(inv_extra):
                    line_vals.update(inv_extra(cls))
                Comodel.create(line_vals)
        m2m_vals = {k: v for k, v in vals.items() if isinstance(getattr(cls, k, None), fmod.Many2many)}
        if m2m_vals:
            new_rec.write(m2m_vals)
        # Phase 119: base.automation on_create
        if env:
            from core.orm.automation import run_base_automation
            run_base_automation(env, "on_create", cls._name, [new_id], vals)
        return new_rec

    def _unlink_impl(self) -> bool:
        """Delete record(s) from DB. Phase 100: ondelete=cascade deletes referencing records first."""
        env = getattr(self, "env", None)
        if env and getattr(env, "uid", None) and self._ids:
            allowed = self._model.search([("id", "in", self._ids)], operation="unlink")
            allowed_ids = set(allowed.ids if hasattr(allowed, "ids") else [])
            denied = [rid for rid in self._ids if rid not in allowed_ids]
            if denied:
                raise PermissionError(f"Access denied by record rule for unlink on {self._model._name}: {denied}")
        cr = self._get_cr()
        if not cr or not self._ids:
            return True
        from core.orm import fields as fmod
        registry = getattr(self._model, "_registry", None)
        if registry:
            for other_name, Other in registry._models.items():
                for fname in dir(Other):
                    if fname.startswith("_"):
                        continue
                    field = getattr(Other, fname, None)
                    if not isinstance(field, fmod.Many2one):
                        continue
                    if getattr(field, "comodel", "") != self._model._name:
                        continue
                    if getattr(field, "ondelete", "set null") != "cascade":
                        continue
                    try:
                        env = getattr(self._model._registry, "_env", None)
                        if not env or not hasattr(env, "cr"):
                            continue
                        refs = Other.search([(fname, "in", self._ids)])
                        if refs and refs._ids:
                            Other(env, refs._ids).unlink()
                    except Exception:
                        pass
        # Phase 119: base.automation on_unlink (before delete)
        env = getattr(self, "env", None)
        if env and self._ids:
            from core.orm.automation import run_base_automation
            run_base_automation(env, "on_unlink", self._model._name, self._ids)
        table = self._model._table
        placeholders = ", ".join("%s" for _ in self._ids)
        cr.execute(f'DELETE FROM "{table}" WHERE id IN ({placeholders})', self._ids)
        return True

    @classmethod
    def copy(cls: Type[T], id: int, default: Optional[Dict[str, Any]] = None) -> T:
        """Duplicate a record. Excludes One2many fields. Appends ' (copy)' to name/display_name (Phase 72)."""
        if not id:
            raise ValueError("copy requires id")
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            raise ValueError("copy requires env")
        from core.orm import fields as fmod
        o2m_fields = {k for k in dir(cls) if not k.startswith("_") and isinstance(getattr(cls, k, None), fmod.One2many)}
        stored = cls._get_stored_field_names()
        read_fields = ["id"] + [c for c in stored if c != "id"]
        rows = cls.browse(id).read(read_fields)
        if not rows:
            raise ValueError(f"Record {id} not found")
        computed_stored = set(cls._get_stored_computed_fields())
        related_stored = set(cls._get_stored_related_fields())
        vals = {
            k: v for k, v in rows[0].items()
            if k != "id" and k not in o2m_fields and k not in computed_stored and k not in related_stored
        }
        vals.pop("id", None)
        for fname in ("name", "display_name"):
            if fname in vals and vals[fname] and isinstance(vals[fname], str):
                vals[fname] = vals[fname] + " (copy)"
                break
        if default:
            vals.update(default)
        return cls.create(vals)

    @classmethod
    def import_data(
        cls: Type[T],
        fields: List[str],
        rows: List[List[Any]],
    ) -> Dict[str, Any]:
        """Import rows. fields[i] maps to row[i]. Returns {created, updated, errors} (Phase 86)."""
        from core.orm import fields as fmod
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return {"created": 0, "updated": 0, "errors": []}
        result = {"created": 0, "updated": 0, "errors": []}
        id_idx = -1
        if "id" in fields:
            id_idx = fields.index("id")
        for row_idx, row in enumerate(rows):
            if len(row) != len(fields):
                result["errors"].append({"row": row_idx + 1, "field": "", "message": "Row length mismatch"})
                continue
            vals = {fields[i]: row[i] for i in range(len(fields))}

            # Resolve Many2one text to ID
            for fname in list(vals.keys()):
                val = vals.get(fname)
                if val is None or val == "" or val is False:
                    continue
                field = getattr(cls, fname, None)
                if not isinstance(field, fmod.Many2one):
                    continue
                comodel = getattr(field, "comodel", "")
                if not comodel:
                    continue
                if isinstance(val, (int, float)) and val == int(val):
                    vals[fname] = int(val)
                    continue
                text = str(val).strip()
                if not text:
                    vals[fname] = False
                    continue
                Comodel = env.get(comodel)
                if not Comodel:
                    continue
                matches = Comodel.name_search(text, [], "ilike", limit=2)
                if len(matches) == 0:
                    result["errors"].append({"row": row_idx + 1, "field": fname, "message": f"'{text}' not found"})
                    continue
                if len(matches) > 1:
                    result["errors"].append({"row": row_idx + 1, "field": fname, "message": f"'{text}' ambiguous"})
                    continue
                vals[fname] = matches[0][0]

            try:
                if id_idx >= 0 and row[id_idx] and row[id_idx] not in (None, "", False):
                    rid = int(row[id_idx])
                    cls.browse(rid).write({k: v for k, v in vals.items() if k != "id"})
                    result["updated"] += 1
                else:
                    create_vals = {k: v for k, v in vals.items() if k != "id"}
                    cls.create(create_vals)
                    result["created"] += 1
            except Exception as e:
                result["errors"].append({"row": row_idx + 1, "field": "", "message": str(e)})
        return result

    @classmethod
    def onchange(cls: Type[T], field_name: str, vals: Dict[str, Any]) -> Dict[str, Any]:
        """Run onchange handler for field if defined. Returns dict of values to update form."""
        method_name = "_onchange_" + (field_name or "").replace(".", "_")
        method = getattr(cls, method_name, None)
        if callable(method):
            try:
                result = method(vals)
                return dict(result) if result else {}
            except Exception:
                return {}
        return {}

    @classmethod
    def name_get(cls: Type[T], ids: List[int]) -> List[Tuple[int, str]]:
        """Return [(id, display_name), ...] for records (Phase 70)."""
        if not ids:
            return []
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return [(i, str(i)) for i in ids]
        rows = cls.browse(ids).read(["id", "name", "display_name"])
        by_id = {r["id"]: (r.get("display_name") or r.get("name") or str(r["id"])) for r in rows}
        return [(i, by_id.get(i, str(i))) for i in ids]

    @classmethod
    def name_search(
        cls: Type[T],
        name: str = "",
        domain: Optional[List] = None,
        operator: str = "ilike",
        limit: int = 8,
    ) -> List[Tuple[int, str]]:
        """Search by name, return name_get format. Used for Many2one autocomplete (Phase 70)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        combined = list(domain or [])
        if name and isinstance(name, str) and name.strip():
            term = name.strip()
            if operator == "ilike":
                combined = combined + [("name", "ilike", f"%{term}%")]
            else:
                combined = combined + [("name", operator, term)]
        recs = cls.search(domain=combined, limit=limit)
        return cls.name_get(recs.ids) if recs.ids else []

    @classmethod
    def search(
        cls: Type[T],
        domain: Optional[List] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None,
        operation: str = "read",
    ) -> Recordset:
        """Search records. domain format: [('field','op','value'), ...]."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return Recordset(cls, [])
        from core.orm.security import get_record_rules
        model_name = getattr(cls, "_name", "")
        uid = getattr(env, "uid", 1)
        rule_domains = get_record_rules(model_name, uid, env=env, operation=operation)
        combined = list(domain or [])
        for rd in rule_domains:
            combined = combined + [rd]  # Each rule is one term (e.g. ['|', A, B])
        domain = combined
        table = cls._table
        where = "1=1"
        params: List[Any] = []
        if domain:
            dom_where, dom_params = _domain_to_sql(domain, table, cr, cls)
            where = dom_where
            params = list(dom_params)
        order_by = f' ORDER BY {order}' if order else ""
        limit_clause = f" LIMIT {limit}" if limit else ""
        params.append(offset)
        cr.execute(
            f'SELECT id FROM "{table}" WHERE {where}{order_by}{limit_clause} OFFSET %s',
            params,
        )
        ids = [r["id"] if hasattr(r, "keys") else r[0] for r in cr.fetchall()]
        return Recordset(cls, ids, _env=env)

    @classmethod
    def search_count(cls: Type[T], domain: Optional[List] = None, env: Any = None, operation: str = "read") -> int:
        """Return count of records matching domain."""
        env = env or (getattr(cls._registry, "_env", None) if cls._registry else None)
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return 0
        from core.orm.security import get_record_rules
        model_name = getattr(cls, "_name", "")
        uid = getattr(env, "uid", 1)
        rule_domains = get_record_rules(model_name, uid, env=env, operation=operation)
        combined = list(domain or [])
        for rd in rule_domains:
            combined = combined + [rd]  # Each rule is one term (e.g. ['|', A, B])
        domain = combined
        table = cls._table
        where = "1=1"
        params: List[Any] = []
        if domain:
            dom_where, dom_params = _domain_to_sql(domain, table, cr, cls)
            where = dom_where
            params = list(dom_params)
        cr.execute(f'SELECT COUNT(*) FROM "{table}" WHERE {where}', params)
        row = cr.fetchone()
        return row["count"] if hasattr(row, "keys") else row[0]

    @classmethod
    def search_read(
        cls: Type[T],
        domain: Optional[List] = None,
        fields: Optional[List[str]] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search and read in one call. Returns list of dicts."""
        recs = cls.search(domain=domain, offset=offset, limit=limit, order=order)
        if not recs.ids:
            return []
        # Use recs.read() so env from search is preserved (Phase 105: avoids closed cursor)
        return recs.read(fields)

    @classmethod
    def read_group(
        cls: Type[T],
        domain: Optional[List] = None,
        fields: Optional[List[str]] = None,
        groupby: Optional[List[str]] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        orderby: Optional[str] = None,
        lazy: bool = True,
        env: Any = None,
        operation: str = "read",
    ) -> List[Dict[str, Any]]:
        """SQL GROUP BY with SUM/COUNT aggregation. Returns [{groupby_field: val, field: agg, __count: n}]."""
        env = env or (getattr(cls._registry, "_env", None) if cls._registry else None)
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr or not groupby:
            return []
        from core.orm.security import get_record_rules
        model_name = getattr(cls, "_name", "")
        uid = getattr(env, "uid", 1)
        rule_domains = get_record_rules(model_name, uid, env=env, operation=operation)
        combined = list(domain or [])
        for rd in rule_domains:
            combined = combined + [rd]  # Each rule is one term (e.g. ['|', A, B])
        domain = combined
        table = cls._table
        stored = cls._get_stored_field_names()
        groupby = list(groupby)
        if lazy and len(groupby) > 1:
            groupby = groupby[:1]
        groupby_valid = [g for g in groupby if g in stored]
        if not groupby_valid:
            return []
        fields = fields or []
        measure_fields = [f for f in fields if f in stored and f != "id"]
        where = "1=1"
        params: List[Any] = []
        if domain:
            dom_where, dom_params = _domain_to_sql(domain, table, cr, cls)
            where = dom_where
            params = list(dom_params)
        select_parts = [f'"{g}"' for g in groupby_valid]
        for m in measure_fields:
            select_parts.append(f'COALESCE(SUM("{m}"), 0) AS "{m}"')
        select_parts.append("COUNT(*) AS __count")
        group_clause = ", ".join(f'"{g}"' for g in groupby_valid)
        order_clause = f" ORDER BY {orderby}" if orderby else ""
        limit_clause = f" LIMIT {limit}" if limit else ""
        offset_clause = f" OFFSET {offset}" if offset else ""
        query = f'SELECT {", ".join(select_parts)} FROM "{table}" WHERE {where} GROUP BY {group_clause}{order_clause}{limit_clause}{offset_clause}'
        cr.execute(query, params)
        rows = cr.fetchall()
        result = []
        for row in rows:
            r = dict(row)
            for g in groupby_valid:
                if r.get(g) is None:
                    r[g] = False
            result.append(r)
        return result

    @classmethod
    def read_ids(cls: Type[T], ids: List[int], fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Read records by ids. Class-level API for RPC (call as Model.read_ids(ids, fields))."""
        if not ids:
            return []
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        rec = cls(env, ids)
        return rec.read(fields)

    @classmethod
    def write_ids(cls: Type[T], ids: List[int], vals: Dict[str, Any]) -> bool:
        """Write vals to records by ids. Class-level API for RPC (called as 'write')."""
        if not ids or not vals:
            return True
        return cls.browse(ids).write(vals)

    @classmethod
    def unlink(cls: Type[T], ids: List[int]) -> bool:
        """Delete records by ids. Class-level API for RPC."""
        if not ids:
            return True
        return cls.browse(ids).unlink()  # Recordset.unlink -> _unlink_impl

    def unlink(self) -> bool:
        """Instance method: delete this recordset (delegates to _unlink_impl)."""
        return self._unlink_impl()


# Alias for API compatibility
Model = ModelBase
