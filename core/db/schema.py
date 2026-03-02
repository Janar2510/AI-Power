"""Schema management - create tables from model definitions."""

import logging
from typing import Any, Dict, List, Optional, Type

import psycopg2
from psycopg2 import sql

from core.orm import fields
from core.orm.models import ModelBase

_logger = logging.getLogger("erp.schema")


def _get_model_fields(model_class: Type[ModelBase]) -> Dict[str, fields.Field]:
    """Extract field definitions from a model class."""
    result = {}
    for name in dir(model_class):
        if name.startswith("_"):
            continue
        obj = getattr(model_class, name)
        if isinstance(obj, fields.Field):
            result[name] = obj
    return result


def _column_def(field: fields.Field) -> str:
    """Get SQL column definition for a field."""
    col_type = getattr(field, "column_type", "varchar")
    if col_type == "varchar":
        size = getattr(field, "size", None)
        if size:
            return f"VARCHAR({size})"
        return "VARCHAR(255)"
    if col_type == "text":
        return "TEXT"
    if col_type == "integer":
        return "INTEGER"
    if col_type == "double precision":
        return "DOUBLE PRECISION"
    if col_type == "boolean":
        return "BOOLEAN DEFAULT FALSE"
    if col_type == "date":
        return "DATE"
    if col_type == "timestamp":
        return "TIMESTAMP"
    return "VARCHAR(255)"


def table_exists(cursor: Any, table_name: str) -> bool:
    """Check if table exists."""
    cursor.execute(
        """
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table_name,),
    )
    return cursor.fetchone() is not None


def create_table(cursor: Any, model_class: Type[ModelBase]) -> None:
    """Create table for model if it does not exist."""
    table = model_class._table
    if not table:
        return
    if table_exists(cursor, table):
        return
    field_defs = _get_model_fields(model_class)
    if not field_defs:
        return
    columns = ["id SERIAL PRIMARY KEY"]
    for name, field in field_defs.items():
        col_def = _column_def(field)
        columns.append(f'"{name}" {col_def}')
    stmt = f'CREATE TABLE "{table}" ({", ".join(columns)})'
    cursor.execute(stmt)
    _logger.info("Created table %s", table)


def init_schema(cursor: Any, registry: Any) -> None:
    """Create tables for all registered models."""
    for model_name, model_class in registry._models.items():
        if hasattr(model_class, "_table") and model_class._table:
            create_table(cursor, model_class)
