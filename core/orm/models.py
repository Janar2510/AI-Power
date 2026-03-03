"""Model base class and recordset."""

from typing import Any, Dict, List, Optional, Type, TypeVar, Iterator, Union

T = TypeVar("T", bound="ModelBase")


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
        if not env:
            return True
        rec = self._model(env, self._ids)
        return rec.unlink()

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
        """Read field values from DB or cache."""
        cr = self._get_cr()
        if not cr or not self._ids:
            return [{"id": rid, **self._cache} for rid in self._ids]
        table = self._model._table
        requested = fields or ["id"]
        stored = self._get_stored_columns()
        cols = [c for c in requested if c in stored]
        if not cols:
            cols = ["id"]
        col_list = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join("%s" for _ in self._ids)
        cr.execute(
            f'SELECT {col_list} FROM "{table}" WHERE id IN ({placeholders})',
            self._ids,
        )
        rows = [dict(row) for row in cr.fetchall()]
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
        cr = self._get_cr()
        if not cr:
            self._cache.update(vals)
            return True
        stored = self._get_stored_columns()
        vals_stored = {k: v for k, v in vals.items() if k in stored}
        if not vals_stored:
            return True
        table = self._model._table
        sets = ", ".join(f'"{k}" = %s' for k in vals_stored)
        cr.execute(
            f'UPDATE "{table}" SET {sets} WHERE id = %s',
            list(vals_stored.values()) + [self._ids[0]],
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
    def create(cls: Type[T], vals: Dict[str, Any]) -> T:
        """Create a new record in DB."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        cr = env.cr if env and hasattr(env, "cr") else None
        if not cr:
            return cls.browse(1)
        table = cls._table
        stored = cls._get_stored_field_names()
        vals_stored = {k: v for k, v in vals.items() if k != "id" and k in stored}
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
        return cls.browse(new_id)

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
        rule_domains = get_record_rules(model_name, uid)
        combined = list(domain or [])
        for rd in rule_domains:
            combined = combined + rd
        domain = combined
        table = cls._table
        where = "1=1"
        params = []
        if domain:
            for term in domain:
                if not isinstance(term, (list, tuple)) or len(term) < 3:
                    continue
                fld, op, val = term[0], term[1], term[2]
                if op == "=":
                    where += f' AND "{fld}" = %s'
                    params.append(val)
                elif op == "!=":
                    where += f' AND "{fld}" != %s'
                    params.append(val)
                elif op == "<=":
                    where += f' AND ("{fld}" IS NULL OR "{fld}" <= %s)'
                    params.append(val)
                elif op == "ilike":
                    where += f' AND "{fld}" ILIKE %s'
                    params.append(f"%{val}%" if isinstance(val, str) else val)
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
    def read(cls: Type[T], ids: List[int], fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Read records by ids. Class-level API for RPC."""
        if not ids:
            return []
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        rec = cls(env, ids)
        return rec.read(fields)

    @classmethod
    def write(cls: Type[T], ids: List[int], vals: Dict[str, Any]) -> bool:
        """Write vals to records by ids. Class-level API for RPC."""
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
