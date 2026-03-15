"""Interactive shell - provides `env` and `registry` like Odoo shell.

Usage:

    erp-bin shell -d erp

This opens a Python REPL (IPython if available) with:
- `env`: Environment for the selected database
- `registry`: ORM registry for that database
- `db`: database name
"""

import code

from psycopg2.extras import RealDictCursor

from core.orm import Environment, Registry


class _RollbackOnErrorCursor:
    """Cursor wrapper that rolls back on execute failure to avoid 'current transaction is aborted'."""

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, vars=None):
        try:
            return self._cursor.execute(query, vars)
        except Exception:
            if hasattr(self._cursor, "connection"):
                try:
                    self._cursor.connection.rollback()
                except Exception:
                    pass
            raise

    def executemany(self, query, vars_list):
        try:
            return self._cursor.executemany(query, vars_list)
        except Exception:
            if hasattr(self._cursor, "connection"):
                try:
                    self._cursor.connection.rollback()
                except Exception:
                    pass
            raise

    def __getattr__(self, name):
        return getattr(self._cursor, name)
from core.orm.models import ModelBase
from core.modules import load_module_graph
from core.sql_db import get_connection
from core.tools import config

from . import Command


class Shell(Command):
    """Open interactive shell with `env` (like Odoo shell)."""

    def run(self, args):
        parser = self.parser
        parser.add_argument(
            "-d",
            "--database",
            dest="database",
            help="Database name (defaults to config db_name or 'erp')",
        )
        parsed = parser.parse_args(args)

        # Ensure config (addons-path, db name, server_wide_modules) is parsed
        cfg = config.parse_config([])
        dbname = parsed.database or cfg.get("db_name", "erp")

        # Prepare registry and environment
        registry = Registry(dbname)
        ModelBase._registry = registry
        load_module_graph()

        with get_connection(dbname) as conn:
            conn.autocommit = True
            raw_cr = conn.cursor(cursor_factory=RealDictCursor)
            cr = _RollbackOnErrorCursor(raw_cr)
            env = Environment(registry, cr=cr, uid=1)

            banner = (
                "ERP Shell\n"
                f"Database: {dbname}\n"
                "Objects:\n"
                "  env      - ORM Environment (env['res.partner'], env['crm.lead'], ...)\n"
                "  registry - Model registry\n"
                "  db       - Database name\n"
            )
            ns = {"env": env, "registry": registry, "db": dbname}

            try:
                # Prefer IPython when available for better UX
                from IPython import embed

                embed(banner1=banner, user_ns=ns)
            except Exception:
                code.interact(banner=banner, local=ns)

