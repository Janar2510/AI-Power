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
    if col_type == "double precision":
        return "DOUBLE PRECISION"
    if col_type == "boolean":
        return "BOOLEAN DEFAULT FALSE"
    if col_type == "date":
        return "DATE"
    if col_type == "timestamp":
        return "TIMESTAMP"
    if col_type == "integer":
        return "INTEGER"
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


def column_exists(cursor: Any, table_name: str, column_name: str) -> bool:
    """Check if column exists in table."""
    cursor.execute(
        """
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s AND column_name = %s
        """,
        (table_name, column_name),
    )
    return cursor.fetchone() is not None


def add_missing_columns(cursor: Any, registry: Any) -> None:
    """Add missing columns to existing tables (simple migration)."""
    for model_name, model_class in registry._models.items():
        table = getattr(model_class, "_table", None)
        if not table or not table_exists(cursor, table):
            continue
        field_defs = _get_model_fields(model_class)
        for col_name, field in field_defs.items():
            if col_name == "id":
                continue
            if not column_exists(cursor, table, col_name):
                col_def = _column_def(field)
                try:
                    cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{col_name}" {col_def}')
                    _logger.info("Added column %s.%s", table, col_name)
                except Exception as e:
                    _logger.warning("Could not add column %s.%s: %s", table, col_name, e)


def init_schema(cursor: Any, registry: Any) -> None:
    """Create tables for all registered models; add missing columns."""
    for model_name, model_class in registry._models.items():
        if hasattr(model_class, "_table") and model_class._table:
            create_table(cursor, model_class)
    add_missing_columns(cursor, registry)
