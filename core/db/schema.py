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


def _column_def(field: fields.Field, *, use_native_vector: bool = True) -> str:
    """Get SQL column definition for a field. Many2one uses INTEGER; FK constraints added separately."""
    col_type = getattr(field, "column_type", "varchar")
    if col_type == "vector":
        if use_native_vector:
            dims = getattr(field, "dimensions", None) or getattr(field, "size", 1536)
            return f"vector({dims})"
        # No pgvector extension: store embeddings as JSONB (ORM wraps lists via Registry._pgvector_native)
        return "JSONB"
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
        default = getattr(field, "default", False)
        if default is True:
            return "BOOLEAN DEFAULT TRUE"
        return "BOOLEAN DEFAULT FALSE"
    if col_type == "date":
        return "DATE"
    if col_type == "timestamp":
        return "TIMESTAMP"
    if col_type == "integer":
        return "INTEGER"
    if col_type == "bytea":
        return "BYTEA"
    if col_type == "numeric":
        return "NUMERIC(16,2)"
    if col_type == "jsonb":
        return "JSONB"
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


def create_table(
    cursor: Any, model_class: Type[ModelBase], *, use_native_vector: bool = True
) -> None:
    """Create table for model if it does not exist."""
    table = model_class._table
    if not table:
        return
    if not getattr(model_class, "_auto_init", True):
        return
    table_query = model_class._get_table_query() if hasattr(model_class, "_get_table_query") else None
    if table_query:
        try:
            cursor.execute(f'CREATE OR REPLACE VIEW "{table}" AS {table_query}')
            _logger.info("Created/updated SQL view %s", table)
        except Exception as e:
            _logger.warning("Could not create SQL view %s: %s", table, e)
        return
    if table_exists(cursor, table):
        return
    field_defs = _get_model_fields(model_class)
    if not field_defs:
        return
    columns = ["id SERIAL PRIMARY KEY"]
    if getattr(model_class, "_log_access", True):
        audit_columns = {
            "create_uid": '"create_uid" INTEGER',
            "create_date": '"create_date" TIMESTAMP',
            "write_uid": '"write_uid" INTEGER',
            "write_date": '"write_date" TIMESTAMP',
        }
        for audit_name, audit_sql in audit_columns.items():
            if audit_name not in field_defs:
                columns.append(audit_sql)
    for name, field in field_defs.items():
        if getattr(field, "column_type", None) is None:
            continue  # virtual fields (One2many, Many2many)
        col_def = _column_def(field, use_native_vector=use_native_vector)
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


def add_missing_columns(
    cursor: Any, registry: Any, *, use_native_vector: bool = True
) -> None:
    """Add missing columns to existing tables (simple migration)."""
    for model_name, model_class in registry._models.items():
        table = getattr(model_class, "_table", None)
        if not table or not table_exists(cursor, table):
            continue
        if getattr(model_class, "_get_table_query", None) and model_class._get_table_query():
            continue
        field_defs = _get_model_fields(model_class)
        if getattr(model_class, "_log_access", True):
            for audit_col, audit_type in (
                ("create_uid", "INTEGER"),
                ("create_date", "TIMESTAMP"),
                ("write_uid", "INTEGER"),
                ("write_date", "TIMESTAMP"),
            ):
                if not column_exists(cursor, table, audit_col):
                    try:
                        cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{audit_col}" {audit_type}')
                    except Exception as e:
                        _logger.warning("Could not add audit column %s.%s: %s", table, audit_col, e)
        for col_name, field in field_defs.items():
            if col_name == "id":
                continue
            if getattr(field, "column_type", None) is None:
                continue
            if not column_exists(cursor, table, col_name):
                col_def = _column_def(field, use_native_vector=use_native_vector)
                try:
                    cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{col_name}" {col_def}')
                    _logger.info("Added column %s.%s", table, col_name)
                except Exception as e:
                    _logger.warning("Could not add column %s.%s: %s", table, col_name, e)


def create_many2many_table(cursor: Any, relation: str, column1: str, column2: str, table1: str, table2: str) -> None:
    """Create Many2many relation table if it does not exist."""
    if table_exists(cursor, relation):
        return
    stmt = f'''CREATE TABLE "{relation}" (
        "{column1}" INTEGER NOT NULL,
        "{column2}" INTEGER NOT NULL,
        PRIMARY KEY ("{column1}", "{column2}")
    )'''
    cursor.execute(stmt)
    _logger.info("Created relation table %s", relation)


def _apply_many2one_fk_constraints(cursor: Any, registry: Any) -> None:
    """Add FK constraints for Many2one fields (Phase 100: ondelete)."""
    for model_name, model_class in registry._models.items():
        table = getattr(model_class, "_table", None)
        if not table or not table_exists(cursor, table):
            continue
        for fname, field in _get_model_fields(model_class).items():
            if not isinstance(field, fields.Many2one):
                continue
            comodel = getattr(field, "comodel", "")
            if not comodel:
                continue
            ref_table = comodel.replace(".", "_")
            if not table_exists(cursor, ref_table):
                continue
            constraint_name = f"{table}_{fname}_fkey"
            cursor.execute(
                "SELECT 1 FROM information_schema.table_constraints "
                "WHERE constraint_name = %s AND table_schema = 'public'",
                (constraint_name,),
            )
            if cursor.fetchone():
                continue
            ondelete = getattr(field, "ondelete", "set null")
            od = "CASCADE" if ondelete == "cascade" else "SET NULL"
            savepoint = f"fk_{table}_{fname}"
            try:
                cursor.execute(f"SAVEPOINT {savepoint}")
                cursor.execute(
                    f'ALTER TABLE "{table}" ADD CONSTRAINT "{constraint_name}" '
                    f'FOREIGN KEY ("{fname}") REFERENCES "{ref_table}" (id) ON DELETE {od}'
                )
                cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
                _logger.info("Added FK %s.%s -> %s ON DELETE %s", table, fname, ref_table, od)
            except Exception as e:
                _logger.warning("Could not add FK %s.%s: %s", table, fname, e)
                try:
                    cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
                except Exception:
                    pass


def _apply_sql_constraints(cursor: Any, model_class: Type[ModelBase]) -> None:
    """Create SQL constraints defined in model._sql_constraints."""
    constraints = getattr(model_class, "_sql_constraints", None)
    if not constraints:
        return
    table = getattr(model_class, "_table", None)
    if not table or not table_exists(cursor, table):
        return
    for name, definition, _message in constraints:
        constraint_name = f"{table}_{name}"
        cursor.execute(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE constraint_name = %s AND table_name = %s",
            (constraint_name, table),
        )
        if cursor.fetchone():
            continue
        try:
            cursor.execute(f'ALTER TABLE "{table}" ADD CONSTRAINT "{constraint_name}" {definition}')
            _logger.info("Added constraint %s on %s", constraint_name, table)
        except Exception as e:
            _logger.warning("Could not add constraint %s on %s: %s", constraint_name, table, e)


def _ensure_pgvector_extension(cursor: Any) -> bool:
    """Enable pgvector extension if available (Phase 136).

    Uses a SAVEPOINT so a missing extension does not abort the whole transaction
    (PostgreSQL marks the transaction failed after a plain CREATE EXTENSION error).
    """
    import time

    sp = f"erp_pgvector_{int(time.time() * 1000000)}"
    try:
        cursor.execute(sql.SQL("SAVEPOINT {}").format(sql.Identifier(sp)))
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
        cursor.execute(sql.SQL("RELEASE SAVEPOINT {}").format(sql.Identifier(sp)))
        _logger.info("pgvector extension enabled")
        return True
    except Exception as e:
        _logger.warning("pgvector extension not available: %s", e)
        try:
            cursor.execute(sql.SQL("ROLLBACK TO SAVEPOINT {}").format(sql.Identifier(sp)))
        except Exception as rb_e:
            _logger.warning("Could not roll back to savepoint %s: %s", sp, rb_e)
        return False


def _create_performance_indexes(cursor: Any) -> None:
    """Phase 204: Create indexes on high-traffic columns."""
    indexes = [
        ("res_partner", "res_partner_email_idx", ["email"]),
        ("sale_order", "sale_order_partner_state_idx", ["partner_id", "state"]),
        ("account_move", "account_move_partner_state_type_idx", ["partner_id", "state", "move_type"]),
        ("account_move", "account_move_type_state_idx", ["move_type", "state"]),
        ("stock_quant", "stock_quant_product_location_idx", ["product_id", "location_id"]),
        ("crm_lead", "crm_lead_stage_idx", ["stage_id"]),
        ("mail_message", "mail_message_res_idx", ["res_model", "res_id"]),
        ("ir_attachment", "ir_attachment_res_idx", ["res_model", "res_id"]),
    ]
    for table, idx_name, columns in indexes:
        if not table_exists(cursor, table):
            continue
        if not all(column_exists(cursor, table, c) for c in columns):
            continue
        try:
            cursor.execute(
                "SELECT 1 FROM pg_indexes WHERE indexname = %s",
                (idx_name,),
            )
            if cursor.fetchone():
                continue
            col_list = ", ".join(f'"{c}"' for c in columns)
            cursor.execute(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{table}" ({col_list})')
            _logger.info("Created index %s on %s", idx_name, table)
        except Exception as e:
            _logger.warning("Could not create index %s: %s", idx_name, e)


def init_schema(cursor: Any, registry: Any) -> None:
    """Create tables for all registered models; add missing columns; create Many2many tables."""
    use_native_vector = _ensure_pgvector_extension(cursor)
    setattr(registry, "_pgvector_native", use_native_vector)
    for model_name, model_class in registry._models.items():
        if hasattr(model_class, "_table") and model_class._table:
            create_table(cursor, model_class, use_native_vector=use_native_vector)
    for model_name, model_class in registry._models.items():
        table = getattr(model_class, "_table", None)
        if not table:
            continue
        for fname, field in _get_model_fields(model_class).items():
            if not isinstance(field, fields.Many2many):
                continue
            rel = getattr(field, "relation", fname + "_rel")
            col1 = getattr(field, "column1", "left_id")
            col2 = getattr(field, "column2", "right_id")
            comodel = getattr(field, "comodel", "")
            table2 = comodel.replace(".", "_") if comodel else "unknown"
            create_many2many_table(cursor, rel, col1, col2, table, table2)
    add_missing_columns(cursor, registry, use_native_vector=use_native_vector)
    _apply_many2one_fk_constraints(cursor, registry)
    for model_name, model_class in registry._models.items():
        _apply_sql_constraints(cursor, model_class)
    _create_performance_indexes(cursor)
