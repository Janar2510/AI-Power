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
    ):
        self.string = string
        self.required = required
        self.readonly = readonly
        self.default = default
        self.help = help

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

    def __init__(self, comodel: str = "", string: str = "", **kwargs):
        super().__init__(string=string, **kwargs)
        self.comodel = comodel


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
    """HTML field - stored as text, for rich content."""

    type = "html"
    column_type = "text"


class Binary(Field):
    """Binary field - stored as bytea in PostgreSQL."""

    type = "binary"
    column_type = "bytea"


class One2many(Field):
    """One2many - virtual inverse of Many2one. No DB column. Read-only MVP."""

    type = "one2many"
    column_type = None  # virtual, no column

    def __init__(
        self,
        comodel: str = "",
        inverse_name: str = "",
        string: str = "",
        **kwargs,
    ):
        super().__init__(string=string, **kwargs)
        self.comodel = comodel
        self.inverse_name = inverse_name


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
