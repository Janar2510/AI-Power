"""Model base class and recordset."""

from typing import Any, Dict, List, Optional, Type, TypeVar, Iterator, Union, Tuple

T = TypeVar("T", bound="ModelBase")


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

    def __init__(self, model: Type["ModelBase"], ids: Optional[List[int]] = None):
        self._model = model
        self._ids = list(ids or [])

    def read(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Read all records in recordset."""
        if not self._ids:
            return []
        env = getattr(self._model._registry, "_env", None) if self._model._registry else None
        if not env:
            return []
        rec = self._model(env, self._ids)
        return rec.read(fields)

    def unlink(self) -> bool:
        """Delete all records in recordset."""
        if not self._ids:
            return True
        env = getattr(self._model._registry, "_env", None) if self._model._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return True
        table = self._model._table
        placeholders = ", ".join("%s" for _ in self._ids)
        cr.execute(f'DELETE FROM "{table}" WHERE id IN ({placeholders})', self._ids)
        return True

    def write(self, vals: Dict[str, Any]) -> bool:
        """Write vals to all records in recordset."""
        if not self._ids or not vals:
            return True
        env = getattr(self._model._registry, "_env", None) if self._model._registry else None
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


class Model(type):
    """Metaclass for model classes."""

    _name: str = ""
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
        if cls._name and cls._registry:
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
                            recs = Comodel.search([(inv_name, "=", rid)])
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
        return rows

    def write(self, vals: Dict[str, Any]) -> bool:
        """Write field values to DB."""
        if not vals or not self._ids:
            return True
        vals = self._model._sanitize_html_vals(vals)
        cr = self._get_cr()
        if not cr:
            self._cache.update(vals)
            return True
        from core.orm import fields as fmod
        stored = self._get_stored_columns()
        vals_stored = {k: v for k, v in vals.items() if k in stored}
        if vals_stored:
            table = self._model._table
            sets = ", ".join(f'"{k}" = %s' for k in vals_stored)
            cr.execute(
                f'UPDATE "{table}" SET {sets} WHERE id = %s',
                list(vals_stored.values()) + [self._ids[0]],
            )
        for fname, val in vals.items():
            field = getattr(self._model, fname, None)
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
    def create(cls: Type[T], vals: Dict[str, Any]) -> T:
        """Create a new record in DB."""
        vals = cls._sanitize_html_vals(vals)
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return cls.browse(1)
        table = cls._table
        stored = cls._get_stored_field_names()
        computed_stored = set(cls._get_stored_computed_fields())
        vals_stored = {
            k: v for k, v in vals.items()
            if k != "id" and k in stored and k not in computed_stored
        }
        cols = [c for c in vals_stored if c in stored]
        if cols:
            col_list = ", ".join(f'"{c}"' for c in cols)
            placeholders = ", ".join("%s" for _ in cols)
            cr.execute(
                f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders}) RETURNING id',
                [vals_stored[c] for c in cols],
            )
        else:
            cr.execute(f'INSERT INTO "{table}" DEFAULT VALUES RETURNING id')
        row = cr.fetchone()
        new_id = row["id"] if hasattr(row, "keys") else row[0]
        new_rec = cls.browse(new_id)
        computed_list = cls._compute_stored_values(new_rec)
        if computed_list and computed_list[0]:
            new_rec.write(computed_list[0])
        from core.orm import fields as fmod
        m2m_vals = {k: v for k, v in vals.items() if isinstance(getattr(cls, k, None), fmod.Many2many)}
        if m2m_vals:
            new_rec.write(m2m_vals)
        return new_rec

    def unlink(self) -> bool:
        """Delete record(s) from DB."""
        cr = self._get_cr()
        if not cr or not self._ids:
            return True
        table = self._model._table
        placeholders = ", ".join("%s" for _ in self._ids)
        cr.execute(f'DELETE FROM "{table}" WHERE id IN ({placeholders})', self._ids)
        return True

    @classmethod
    def search(
        cls: Type[T],
        domain: Optional[List] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None,
    ) -> Recordset:
        """Search records. domain format: [('field','op','value'), ...]."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return Recordset(cls, [])
        from core.orm.security import get_record_rules
        model_name = getattr(cls, "_name", "")
        uid = getattr(env, "uid", 1)
        rule_domains = get_record_rules(model_name, uid, env=env)
        combined = list(domain or [])
        for rd in rule_domains:
            combined = combined + rd
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
        return Recordset(cls, ids)

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
        return cls.browse(recs.ids).read(fields)

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
        return cls.browse(ids).unlink()


# Alias for API compatibility
Model = ModelBase
