"""PostgreSQL database connection and cursor."""

import logging
from contextlib import contextmanager
from typing import Any, Generator, Optional

import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection as PgConnection
from psycopg2.extras import RealDictCursor

from core.tools import config

_logger = logging.getLogger("erp.sql_db")


def _get_connect_params() -> dict:
    """Get connection parameters from config."""
    cfg = config.get_config()
    return {
        "host": cfg.get("db_host", "localhost"),
        "port": cfg.get("db_port", 5432),
        "user": cfg.get("db_user", "postgres"),
        "password": cfg.get("db_password", ""),
        "dbname": cfg.get("db_name", "erp"),
    }


def db_exists(dbname: Optional[str] = None) -> bool:
    """Check if database exists."""
    params = _get_connect_params()
    check_db = dbname or params["dbname"]
    conn_params = {k: v for k, v in params.items() if k != "dbname"}
    conn_params["dbname"] = "postgres"
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (check_db,),
        )
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        return exists
    except Exception as e:
        _logger.warning("db_exists failed: %s", e)
        return False


def create_database(dbname: Optional[str] = None) -> bool:
    """Create database if it does not exist."""
    params = _get_connect_params()
    new_db = dbname or params["dbname"]
    if db_exists(new_db):
        return True
    conn_params = {k: v for k, v in params.items() if k != "dbname"}
    conn_params["dbname"] = "postgres"
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(new_db)))
        cur.close()
        conn.close()
        _logger.info("Created database %s", new_db)
        return True
    except Exception as e:
        _logger.exception("create_database failed: %s", e)
        raise


@contextmanager
def get_connection(dbname: Optional[str] = None) -> Generator[PgConnection, None, None]:
    """Get a database connection. Yields connection, closes on exit."""
    params = _get_connect_params()
    if dbname:
        params["dbname"] = dbname
    conn = psycopg2.connect(**params)
    try:
        try:
            from pgvector.psycopg2 import register_vector
            register_vector(conn)
        except ImportError:
            pass
        yield conn
    finally:
        conn.close()


@contextmanager
def get_cursor(dbname: Optional[str] = None) -> Generator[Any, None, None]:
    """Get a cursor with RealDictCursor (rows as dicts). Commits on success.
    When debug_profiling: wraps cursor to record query count and timing (Phase 144)."""
    with get_connection(dbname) as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            if config.get_config().get("debug_profiling"):
                try:
                    from core.profiling import wrap_cursor_for_profiling
                    wrap_cursor_for_profiling(cur)
                except ImportError:
                    pass
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
