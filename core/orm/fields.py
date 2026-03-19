"""Field types for ORM models."""

from typing import Any, Callable, List, Optional, Tuple, Union


class Field:
    """Base field descriptor."""

    type = "char"
    column_type = "varchar"

    def __init__(
        self,
        string: str = "",
        required: bool = False,
        readonly: bool = False,
        default: Any = None,
        help: str = "",
        tracking: bool = False,
        **kwargs,
    ):
        self.string = string
        self.required = required
        self.readonly = readonly
        self.default = default
        self.help = help
        self.tracking = tracking
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __set_name__(self, owner, name: str):
        self.name = name
        if not self.string:
            self.string = name.replace("_", " ").title()


class Char(Field):
    """Character field."""

    type = "char"
    column_type = "varchar"

    def __init__(self, size: Optional[int] = None, **kwargs):
        super().__init__(**kwargs)
        self.size = size


class Text(Field):
    """Text field."""

    type = "text"
    column_type = "text"


class Integer(Field):
    """Integer field."""

    type = "integer"
    column_type = "integer"


class Float(Field):
    """Float field."""

    type = "float"
    column_type = "double precision"


class Monetary(Field):
    """Monetary field - stores amount, paired with currency_field (default currency_id)."""

    type = "monetary"
    column_type = "numeric"

    def __init__(self, currency_field: str = "currency_id", string: str = "", **kwargs):
        super().__init__(string=string, **kwargs)
        self.currency_field = currency_field


class Boolean(Field):
    """Boolean field."""

    type = "boolean"
    column_type = "boolean"

    def __init__(self, default: bool = False, **kwargs):
        super().__init__(default=default, **kwargs)


class Date(Field):
    """Date field."""

    type = "date"
    column_type = "date"


class Datetime(Field):
    """Datetime field."""

    type = "datetime"
    column_type = "timestamp"


class Many2one(Field):
    """Many2one relation - stores FK (integer) to comodel."""

    type = "many2one"
    column_type = "integer"

    def __init__(
        self,
        comodel: str = "",
        string: str = "",
        ondelete: str = "set null",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.comodel = comodel
        self.ondelete = ondelete  # 'set null' or 'cascade'


class Selection(Field):
    """Selection field - exclusive choice from [(value, label), ...]."""

    type = "selection"
    column_type = "varchar"

    def __init__(
        self,
        selection: Optional[List[Tuple[str, str]]] = None,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.selection = selection or []


class Html(Field):
    """HTML field - stored as text, for rich content. Sanitized on write (script/style stripped)."""

    type = "html"
    column_type = "text"


class Reference(Field):
    """Phase 236: Reference field - stores 'model_name,id' for polymorphic reference."""

    type = "reference"
    column_type = "varchar"

    def __init__(self, string: str = "", size: int = 255, **kwargs):
        super().__init__(string=string, **kwargs)
        self.size = size


class Many2oneReference(Field):
    """Phase 236: Many2oneReference - like Reference but with fixed model from context/discriminator."""

    type = "many2one_reference"
    column_type = "integer"

    def __init__(self, model_field: str = "", string: str = "", **kwargs):
        super().__init__(string=string, **kwargs)
        self.model_field = model_field  # field holding model name (e.g. res_model)


class Json(Field):
    """Phase 236: JSON field - stores dict/list in PostgreSQL JSONB."""

    type = "json"
    column_type = "jsonb"


class Properties(Field):
    """Phase 236: Properties field - flexible schema key-value stored as JSONB."""

    type = "properties"
    column_type = "jsonb"

    def __init__(self, string: str = "", definition: Optional[str] = None, **kwargs):
        super().__init__(string=string, **kwargs)
        self.definition = definition  # optional: model.field for PropertiesDefinition


class PropertiesDefinition(Field):
    """Phase 236: PropertiesDefinition - schema definition for Properties fields."""

    type = "properties_definition"
    column_type = "jsonb"  # stores definition as JSON


class Computed(Field):
    """Computed field - value from compute method, optionally stored. Phase 210: compute can be method name (str) or callable."""

    type = "computed"

    def __init__(
        self,
        compute: Optional[Union[str, Callable]] = None,
        store: bool = False,
        depends: Optional[List[str]] = None,
        inverse: Optional[Callable] = None,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, readonly=True, **kwargs)
        self.compute = compute if compute is not None else ""
        self.store = store
        self.depends = depends or []
        self.inverse = inverse
        self.column_type = "varchar" if store else None


class Vector(Field):
    """Vector field for pgvector - stores embedding for semantic search (Phase 136)."""

    type = "vector"
    column_type = "vector"

    def __init__(self, dimensions: int = 1536, string: str = "", **kwargs):
        super().__init__(string=string, **kwargs)
        self.dimensions = dimensions
        self.size = dimensions  # schema uses size for vector dims


class Binary(Field):
    """Binary field - stored as bytea in PostgreSQL."""

    type = "binary"
    column_type = "bytea"


class Image(Field):
    """Image field - extends Binary with max_width, max_height (Phase 103)."""

    type = "image"
    column_type = "bytea"

    def __init__(
        self,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.max_width = max_width
        self.max_height = max_height


class Related(Field):
    """Related field - reads value through relational chain. MVP: single-level (rel_field.target_field)."""

    type = "related"

    def __init__(
        self,
        related: str = "",
        store: bool = False,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, readonly=True, **kwargs)
        self.related = related or ""
        self.store = store
        self.column_type = "varchar" if store else None


class One2many(Field):
    """One2many - virtual inverse of Many2one. No DB column. Read-only MVP."""

    type = "one2many"
    column_type = None  # virtual, no column

    def __init__(
        self,
        comodel: str = "",
        inverse_name: str = "",
        domain: Optional[Union[List, Callable[..., List]]] = None,
        inverse_extra: Optional[Callable[..., dict]] = None,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.comodel = comodel
        self.inverse_name = inverse_name
        self.domain = domain  # optional: list or callable(model_cls) -> list, merged with inverse when reading
        self.inverse_extra = inverse_extra  # optional: callable(model_cls) -> dict, merged into line_vals when creating


class Many2many(Field):
    """Many2many - relation table. column1=this model, column2=comodel."""

    type = "many2many"
    column_type = None  # uses relation table

    def __init__(
        self,
        comodel: str = "",
        relation: Optional[str] = None,
        column1: Optional[str] = None,
        column2: Optional[str] = None,
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.comodel = comodel
        self._relation = relation  # set in __set_name__ if None
        self.column1 = column1 or "left_id"
        self.column2 = column2 or "right_id"

    def __set_name__(self, owner: type, name: str):
        super().__set_name__(owner, name)
        if self._relation is not None:
            self.relation = self._relation
        elif self.comodel and hasattr(owner, "_name") and owner._name:
            self.relation = f"{owner._name}_{self.comodel}_rel".replace(".", "_")
        else:
            self.relation = f"{name}_rel"
