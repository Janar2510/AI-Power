"""Field types for ORM models."""

from typing import Any, Callable, Optional


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
